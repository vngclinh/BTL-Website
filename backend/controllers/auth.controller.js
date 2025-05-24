const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ApiResponse = require("../utils/apiResponse");
const ErrorHandler = require("../utils/errorHandler");

let refreshTokens = [];

exports.signup = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 8);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    ApiResponse.created(res, "User registered successfully", {
      id: user.userid,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    if (error.code === "23505") {
      // PostgreSQL duplicate key error code
      return next(new ErrorHandler(400, "Username or email already exists"));
    }
    next(new ErrorHandler(500, "Registration failed", error));
  }
};

exports.signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return next(new ErrorHandler(404, "User not found"));
    }

    // Check password
    const passwordIsValid = bcrypt.compareSync(password, user.passwordhash);
    if (!passwordIsValid) {
      return next(new ErrorHandler(401, "Invalid password"));
    }

    // Create tokens
    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    refreshTokens.push(refreshToken);

    // Set refresh token as HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true, // Only use secure in production
      path: "/",
      sameSite: "strict",
    });

    // Return response with access token
    ApiResponse.success(res, "Login successful", {
      id: user.userid,
      username: user.username,
      email: user.email,
      role: user.role,
      accessToken: token,
    });
  } catch (error) {
    next(new ErrorHandler(500, "Login failed", error));
  }
};

exports.verifyPassword = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findByEmail(email);

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Người dùng không tồn tại" });

    const isMatch = bcrypt.compareSync(password, user.passwordhash);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Mật khẩu không đúng" });
    }

    res.json({ success: true });
  } catch (error) {
    next(new ErrorHandler(500, "Xác minh mật khẩu thất bại", error));
  }
};

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.userid,
      username: user.username,
      avatarurl: user.avatarurl,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30m",
    }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.userid, username: user.username, role: user.role },
    process.env.JWT_REFRESH_KEY,
    {
      expiresIn: "30d",
    }
  );
};

exports.requestRefreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "You're not authenticated" });
  }

  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json({ message: "Refresh token is not valid" });
  }

  jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_KEY,
    async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Token verification failed" });
      }

      // Lấy user từ DB
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove old token
      refreshTokens = refreshTokens.filter((token) => token !== refreshToken);

      // Generate new tokens
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      refreshTokens.push(newRefreshToken);

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "strict",
      });

      res.status(200).json({ accessToken: newAccessToken });
    }
  );
};

exports.userLogout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  // Remove refresh token from array
  if (refreshToken) {
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
  }

  // Clear the cookie
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "strict",
  });

  res.status(200).json({ message: "Logged out successfully" });
};
const crypto = require("crypto");
const nodemailer = require("nodemailer");

exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findByEmail(email);
    if (!user) {
      return next(new ErrorHandler(404, "Email không tồn tại"));
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    // Lưu token vào DB
    await User.saveResetToken(user.userid, token, expiry);

    const resetUrl = `${process.env.CLIENT_URL}/reset-password.html?token=${token}`;

    await sendResetEmail(user.email, user.username, resetUrl);

    ApiResponse.success(res, "Email đặt lại mật khẩu đã được gửi");
  } catch (error) {
    next(new ErrorHandler(500, "Gửi yêu cầu quên mật khẩu thất bại", error));
  }
};
const sendResetEmail = async (toEmail, username, resetUrl) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"The Outsider" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Yêu cầu đặt lại mật khẩu",
    html: `
      <p>Chào ${username},</p>
      <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào nút bên dưới để tiếp tục:</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background-color:#c22b2b;color:white;text-decoration:none;border-radius:4px;">Đặt lại mật khẩu</a>
      <p>Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua email này.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
exports.resetPassword = async (req, res, next) => {
  const { token, newPassword } = req.body;

  try {
    const user = await User.findByResetToken(token);

    if (!user) {
      return next(new ErrorHandler(400, "Link đã hết hạn, vui lòng thử lại"));
    }

    if (new Date(user.resetpasswordexpiry) < new Date()) {
      return next(
        new ErrorHandler(
          400,
          "Liên kết đặt lại mật khẩu đã hết hạn. Vui lòng gửi lại yêu cầu."
        )
      );
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 8);

    await User.updatePassword(user.userid, hashedPassword);

    // Xoá token sau khi reset
    await User.saveResetToken(user.userid, null, null);

    ApiResponse.success(res, "Mật khẩu đã được đặt lại thành công", {
      userId: user.userid,
    });
  } catch (error) {
    next(new ErrorHandler(500, "Đặt lại mật khẩu thất bại", error));
  }
};
