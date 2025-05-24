const postsPerPage = 10;
let postsData = []; // Lưu toàn bộ bài viết từ API
let filteredPostsData = []; // Lưu bài viết đã được filter và sắp xếp

// ClassicEditor.create(document.querySelector("#articleContent"), {
//   toolbar: [
//     "heading",
//     "|",
//     "bold",
//     "italic",
//     "link",
//     "|",
//     "bulletedList",
//     "numberedList",
//     "|",
//     "blockQuote",
//     "insertTable",
//     "|",
//     "imageUpload",
//     "undo",
//     "redo",
//   ],
//   image: {
//     toolbar: ["imageTextAlternative", "|", "toggleImageCaption"],
//     caption: {
//       enabled: true,
//     },
//   },
// })
//   .then((editor) => {
//     editor.plugins.get("FileRepository").createUploadAdapter = (loader) => {
//       return new MyUploadAdapter(loader);
//     };
//     window.articleEditor = editor;
//     const voiceLabel = document.querySelector(".ck.ck-voice-label");
//     if (voiceLabel) {
//       voiceLabel.remove();
//     }
//   })
//   .catch((error) => {
//     console.error("CKEditor load failed:", error);
//   });

// Hàm chính để render bảng bài viết
function renderPostTable() {
  const tbody = document.querySelector("#posts tbody");
  if (!tbody) return;

  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const paginated = filteredPostsData.slice(startIndex, endIndex);

  tbody.innerHTML = paginated
    .map((post) => {
      const shortTitle =
        post.title.length > 40 ? post.title.slice(0, 60) + "..." : post.title;
      const date = new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(post.publishedat || post.createdat));
      const statusMap = {
        pending: "Chờ duyệt",
        published: "Đã duyệt",
        reject: "Từ chối",
      };
      //           <button class="btn btn-edit-post" data-id="${post.postid}" title="Sửa"><i class="fa-solid fa-wrench"></i></button>
      let actions = "";
      if (post.status === "pending") {
        actions += `
          <button class="btn btn-approve-post" data-id="${
            post.postid
          }" data-id2=${post.authorid} data-id3="${post.title.replace(
          /"/g,
          "&quot;"
        )}"
 title="Duyệt bài"><i class="fa-solid fa-check"></i></button>
          <button class="btn btn-reject-post" data-id="${
            post.postid
          }" data-id2=${post.authorid} data-id3="${post.title.replace(
          /"/g,
          "&quot;"
        )}"
 title="Từ chối bài"><i class="fa-solid fa-xmark"></i></button>
        `;
      } else if (post.status === "published") {
        actions += `
          <button class="btn btn-unapprove-post" data-id="${
            post.postid
          }" data-id2=${post.authorid} data-id3="${post.title.replace(
          /"/g,
          "&quot;"
        )}"
 title="Gỡ duyệt"><i class="fa-regular fa-font-awesome"></i></button>
          <button class="btn btn-delete-post" data-id="${
            post.postid
          }" data-id2=${post.authorid} data-id3="${post.title.replace(
          /"/g,
          "&quot;"
        )}"
 title="Xóa"><i class="fas fa-trash"></i></button>
        `;
      } else if (post.status === "reject") {
        actions += `
          <button class="btn btn-approve-post" data-id="${
            post.postid
          }" data-id2=${post.authorid} data-id3="${post.title.replace(
          /"/g,
          "&quot;"
        )}"
 title="Duyệt lại"><i class="fa-solid fa-check"></i></button>
          <button class="btn btn-delete-post" data-id="${
            post.postid
          }" data-id2=${post.authorid} data-id3="${post.title.replace(
          /"/g,
          "&quot;"
        )}"
 title="Xóa"><i class="fas fa-trash"></i></button>
        `;
      }

      return `
        <tr>
          <td>${post.postid}</td>
          <td title="${post.title}">${shortTitle}</td>
          <td>${post.authorname}</td>
          <td>${date}</td>
          <td>${post.views}</td>
          <td><span class="status-badge ${post.status}" data-i18n="${
        post.status
      }">${statusMap[post.status]}</span></td>
          <td>${actions}</td>
        </tr>
      `;
    })
    .join("");

  updatePostPagination();
}

// Hàm cập nhật phân trang
function updatePostPagination() {
  const pagination = document.querySelector("#posts .pagination");
  if (!pagination) return;

  const totalPosts = filteredPostsData.length;
  const totalPages = Math.ceil(totalPosts / postsPerPage);
  pagination.innerHTML = "";

  const maxVisiblePages = 5;
  let startPage = Math.max(
    1,
    Math.min(
      currentPage - Math.floor(maxVisiblePages / 2),
      totalPages - maxVisiblePages + 1
    )
  );
  let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

  // Nút Previous
  const prevButton = document.createElement("button");
  prevButton.className = "btn btn-prev";
  prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderPostTable();
    }
  });
  pagination.appendChild(prevButton);

  // Các nút trang
  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement("button");
    pageButton.className = `btn btn-page ${i === currentPage ? "active" : ""}`;
    pageButton.textContent = i;
    pageButton.addEventListener("click", () => {
      currentPage = i;
      renderPostTable();
    });
    pagination.appendChild(pageButton);
  }

  // Nút Next
  const nextButton = document.createElement("button");
  nextButton.className = "btn btn-next";
  nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderPostTable();
    }
  });
  pagination.appendChild(nextButton);
}

// Hàm load bài viết từ API
async function loadPosts() {
  try {
    const res = await fetch("http://localhost:5501/api/posts");
    const data = await res.json();
    postsData = data.data.posts || [];
    filteredPostsData = [...postsData]; // Khởi tạo filteredPostsData
    // Áp dụng filter mặc định
    applyFilters();
  } catch (err) {
    console.error("❌ Lỗi khi load bài viết:", err);
  }
}

// Hàm áp dụng các bộ lọc
function applyFilters() {
  const status = document.getElementById("postStatusFilter").value;
  const categoryId = document.getElementById("postCateFilter").value;
  const viewOrder = document.getElementById("postViews").value;

  // Filter theo status
  let filtered =
    status === "all"
      ? [...postsData]
      : postsData.filter((post) => post.status === status);

  // Filter theo category
  if (categoryId !== "all") {
    const selectedOption = document.querySelector(
      `#postCateFilter option[value="${categoryId}"]`
    );
    const selectedCategoryName = selectedOption?.textContent?.trim();

    filtered = filtered.filter((post) =>
      post.categories.includes(selectedCategoryName)
    );
  }

  // Sắp xếp
  if (viewOrder === "from-high") {
    filtered.sort((a, b) => b.views - a.views);
  } else if (viewOrder === "from-low") {
    filtered.sort((a, b) => a.views - b.views);
  } else {
    filtered.sort((a, b) => b.postid - a.postid); // Mặc định sắp xếp theo ID
  }

  filteredPostsData = filtered;
  currentPage = 1; // Reset về trang đầu tiên
  renderPostTable();
}

// Hàm load danh mục cho filter
async function loadCategoriesToFilter() {
  try {
    const res = await fetch("http://localhost:5501/api/categories");
    const result = await res.json();
    const tree = result.data;

    const flatCategories = flattenCategories(tree);

    const select = document.getElementById("postCateFilter");
    if (!select) return;

    select.innerHTML = `<option value="all" data-i18n="all">Tất cả</option>`;

    flatCategories.forEach((cat) => {
      const option = document.createElement("option");

      // Dịch thông qua categories-list nếu có
      option.setAttribute("data-i18n", `categories-list.${cat.name}`);
      option.value = cat.id;
      option.textContent = cat.name;

      select.appendChild(option);
    });

    // Sau khi render xong: dịch
    const lang = localStorage.getItem("lang") || "vietnamese";
    updateText(lang);
  } catch (err) {
    console.error("Lỗi load danh mục:", err);
  }
}

// Hàm làm phẳng cây danh mục
function flattenCategories(tree, prefix = "") {
  let flat = [];
  tree.forEach((cat) => {
    flat.push({
      id: cat.id,
      name: prefix + cat.name,
    });
    if (cat.children && cat.children.length > 0) {
      flat = flat.concat(flattenCategories(cat.children, prefix + ""));
    }
  });
  return flat;
}

// Hàm tìm kiếm bài viết
document.getElementById("postSearchBtn").addEventListener("click", async () => {
  const keyword = document.getElementById("postSearchInput").value.trim();

  if (!keyword) {
    loadPosts();
    return;
  }

  try {
    const res = await fetch(
      `http://localhost:5501/api/posts/search?keyword=${encodeURIComponent(
        keyword
      )}`
    );
    const result = await res.json();
    if (result.success && result.data?.posts) {
      postsData = result.data.posts;
      applyFilters(); // Áp dụng lại các filter hiện tại
    } else {
      console.warn("Không tìm thấy bài viết.");
    }
  } catch (err) {
    console.error(" Lỗi tìm kiếm bài viết:", err);
  }
});

// Sự kiện tìm kiếm khi nhấn Enter
document
  .getElementById("postSearchInput")
  .addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      document.getElementById("postSearchBtn").click();
    }
  });

// Sự kiện cho các bộ lọc
document
  .getElementById("postStatusFilter")
  ?.addEventListener("change", applyFilters);
document
  .getElementById("postCateFilter")
  ?.addEventListener("change", applyFilters);
document.getElementById("postViews")?.addEventListener("change", applyFilters);

// Sự kiện cho các nút action
document.querySelector("#posts tbody").addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (btn) {
    const postId = parseInt(btn.getAttribute("data-id"));
    const authorid = parseInt(btn.getAttribute("data-id2"));
    const postTitle = btn.getAttribute("data-id3");
    if (!postId) return;

    try {
      if (btn.classList.contains("btn-approve-post")) {
        showConfirmModal("confirm-approve-post", async () => {
          await updatePostStatus(postId, "published");
          sendNotification({
            title: "noti-approve-title",
            message: ("noti-approve-msg", { title: postTitle }),
            toUserId: authorid,
          });
          showToast("Đã duyệt bài viết thành công", "success");
          loadPosts();
        });
      } else if (btn.classList.contains("btn-reject-post")) {
        showConfirmModal("confirm-reject-post", async () => {
          await updatePostStatus(postId, "rejected");
          sendNotification({
            title: "noti-reject-title",
            message: ("noti-reject-msg", { title: postTitle }),
            toUserId: authorid,
          });
          showToast("Đã từ chối bài viết", "success");
          loadPosts();
        });
      } else if (btn.classList.contains("btn-unapprove-post")) {
        showConfirmModal("confirm-unapprove-post", async () => {
          await updatePostStatus(postId, "pending");
          sendNotification({
            title: "noti-unapprove-title",
            message: ("noti-unapprove-msg", { title: postTitle }),
            toUserId: authorid,
          });
          showToast("Đã gỡ duyệt bài viết", "success");
          loadPosts();
        });
      } else if (btn.classList.contains("btn-delete-post")) {
        showConfirmModal("confirm-delete-post", async () => {
          await deletePost(postId);
          sendNotification({
            title: "noti-delete-title",
            message: ("noti-delete-msg", { title: postTitle }),
            toUserId: authorid,
          });
          showToast("Đã xóa bài viết", "success");
          loadPosts();
        });
      }
    } catch (error) {
      console.error("Action failed:", error);
      showToast(error.message || "Có lỗi xảy ra", "error");
    }
    return;
  }

  const row = e.target.closest("tr");
  if (!row) return;

  const rows = Array.from(document.querySelectorAll("#posts tbody tr"));
  const index = rows.indexOf(row);
  const post = filteredPostsData[(currentPage - 1) * postsPerPage + index];
  if (!post) return;

  renderPostToModal(post);
  document.getElementById("postDetailModal").classList.add("show");
});

// Hàm cập nhật trạng thái bài viết
async function updatePostStatus(postId, status) {
  try {
    const token = await getAccessTokenFromRefresh();

    let endpoint, method, body;

    // Xác định endpoint và method dựa trên action
    switch (status) {
      case "published":
        endpoint = `/api/posts/${postId}/approve`;
        method = "PUT";
        break;
      case "rejected":
        endpoint = `/api/posts/${postId}/reject`;
        method = "PUT";
        break;
      case "pending":
        endpoint = `/api/posts/${postId}/unapprove`;
        method = "PUT";
        break;
    }
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    body = JSON.stringify({ postId, status });

    const response = await fetch(`http://localhost:5501${endpoint}`, {
      method,
      headers,
      body: body || undefined,
    });

    if (!response.ok) {
      // Lấy thông báo lỗi chi tiết từ server nếu có
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update post status");
    }

    return await response.json();
  } catch (err) {
    console.error("Error updating post status:", err);
    throw err; // Re-throw để xử lý ở nơi gọi hàm
  }
}

// Hàm xóa bài viết
async function deletePost(postId) {
  try {
    const token = await getAccessTokenFromRefresh();
    const res = await fetch(`http://localhost:5501/api/posts/${postId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Xóa bài viết thất bại");

    showToast("Đã xóa bài viết", "success");
    loadPosts();
  } catch (err) {
    console.error(err);
    showToast("Lỗi khi xóa bài viết", "error");
  }
}

// Khởi tạo
document.addEventListener("DOMContentLoaded", () => {
  loadCategoriesToFilter();
  loadPosts();
});
class MyUploadAdapter {
  constructor(loader) {
    this.loader = loader;
  }

  upload() {
    return this.loader.file.then((file) => {
      const data = new FormData();
      data.append("upload", file);

      return fetch("http://localhost:5501/api/uploads?folder=ckeditor", {
        method: "POST",
        body: data,
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.url) {
            return { default: res.url };
          } else {
            throw new Error(res.message || "Upload failed");
          }
        });
    });
  }

  abort() {
    // Nếu cần handle hủy upload
  }
}

let isEditing = false;
let currentPost = null;

function renderPostToModal(post) {
  currentPost = post;
  isEditing = false;

  // Gán dữ liệu
  document.getElementById("post-title-view").textContent = post.title;
  document.getElementById("post-title-edit").value = post.title;

  document.getElementById("post-meta-view").innerHTML = `
    <strong>Tác giả:</strong> ${post.authorname} |
    <strong>Ngày:</strong> ${new Date(post.createdat).toLocaleDateString(
      "vi-VN"
    )}
  `;

  document.getElementById("post-body-view").innerHTML = post.content;
  document.getElementById("articleContent").value = post.content;

  if (window.articleEditor) {
    window.articleEditor.setData(post.content);
  }

  toggleEditMode(false);
}

function toggleEditMode(editing) {
  isEditing = editing;

  document.getElementById("post-title-view").style.display = editing
    ? "none"
    : "inline";
  document.getElementById("post-title-edit").style.display = editing
    ? "inline"
    : "none";

  document.getElementById("post-body-view").style.display = editing
    ? "none"
    : "block";
  document.getElementById("articleContent").style.display = editing
    ? "block"
    : "none";

  document.getElementById("edit-btn").style.display = editing
    ? "none"
    : "inline-block";
  document.getElementById("save-btn").style.display = editing
    ? "inline-block"
    : "none";
}
document.getElementById("edit-btn").addEventListener("click", async () => {
  toggleEditMode(true);

  const editorContainer = document.getElementById("articleContent");
  if (!editorContainer) return;

  // Gán nội dung hiện tại vào textarea (nếu chưa có)
  editorContainer.value = currentPost.content;

  // Hiển thị textarea để CKEditor tạo editor
  editorContainer.style.display = "none";

  // Nếu đã có editor rồi, không khởi tạo lại
  if (window.articleEditor) return;

  try {
    const editor = await ClassicEditor.create(editorContainer, {
      toolbar: [
        "heading",
        "|",
        "bold",
        "italic",
        "link",
        "|",
        "bulletedList",
        "numberedList",
        "|",
        "blockQuote",
        "insertTable",
        "|",
        "imageUpload",
        "undo",
        "redo",
      ],
      image: {
        toolbar: ["imageTextAlternative", "|", "toggleImageCaption"],
        caption: {
          enabled: true,
        },
      },
    });

    editor.plugins.get("FileRepository").createUploadAdapter = (loader) => {
      return new MyUploadAdapter(loader);
    };

    window.articleEditor = editor;

    // Loại bỏ label screen reader nếu muốn
    const voiceLabel = document.querySelector(".ck.ck-voice-label");
    if (voiceLabel) voiceLabel.remove();
  } catch (err) {
    console.error("CKEditor load failed:", err);
  }
});

document.getElementById("cancel-btn").addEventListener("click", () => {
  // Nếu đang chỉnh sửa -> huỷ chỉnh sửa
  if (isEditing) {
    renderPostToModal(currentPost); // reset lại dữ liệu
  } else {
    document.getElementById("postDetailModal").classList.remove("show");
  }
});

document.getElementById("save-btn").addEventListener("click", async () => {
  const updatedTitle = document.getElementById("post-title-edit").value;
  let updatedContent = "";

  if (window.articleEditor) {
    updatedContent = await window.articleEditor.getData();
  } else {
    updatedContent = document.getElementById("articleContent").value;
  }

  try {
    await updatePost(currentPost.postid, {
      ...currentPost,
      title: updatedTitle,
      content: updatedContent,
    });

    showToast("Cập nhật thành công", "success");
    toggleEditMode(false);
  } catch (err) {
    console.error("Lỗi cập nhật:", err);
    showToast("Lỗi khi cập nhật bài viết", "error");
  }
});

async function updatePost(postId, updatedData) {
  const token = await getAccessTokenFromRefresh();
  const res = await fetch(`http://localhost:5501/api/posts/${postId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updatedData),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Cập nhật thất bại");
  }

  return await res.json();
}
document.getElementById("addPostBtn")?.addEventListener("click", () => {
  window.location.href = "/pages/user-profile.html#author-site";
});
// Đóng modal khi click ra ngoài nội dung modal
document
  .getElementById("postDetailModal")
  ?.addEventListener("click", function (e) {
    const content = this.querySelector(".modal-contents");
    if (!content.contains(e.target)) {
      this.classList.remove("show");
    }
  });
