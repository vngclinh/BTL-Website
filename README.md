
# The Outsider - News website

A full-stack news website with a Node.js/Express API, PostgreSQL data layer, and a static HTML/CSS/JS frontend. The project includes public news pages, authentication, author/admin workflows, comment moderation, notifications, and an admin dashboard.

## Main Features

- Public news pages: home, topic, search, article detail
- Authentication: sign up, sign in, refresh token, logout, forgot/reset password
- Role-based permissions: `user`, `author`, `admin`
- Post workflow: create, edit, approve/reject, publish, search/filter, view tracking
- Category management with parent-child tree structure
- Comment system with simple toxicity check and moderation states
- Saved posts and viewed-post history per user
- Notifications API (read/unread, mark read, delete)
- Author registration flow with topic selection and ID card images
- Homepage settings (slogan/contact/logo/banner)
- Media uploads:
  - Local disk uploads to `backend/uploads`
  - Cloudinary uploads for editor/homepage assets
- Socket.IO server initialized for realtime messaging events

## Tech Stack

- Backend: Node.js, Express, PostgreSQL (`pg`), JWT, bcrypt, multer, Cloudinary, Nodemailer, Socket.IO
- Frontend: Vanilla HTML/CSS/JavaScript, Bootstrap (dashboard), CKEditor, i18next

## Repository Structure

```text
BTL-Website/
|-- backend/
|   |-- config/          # DB, JWT, Cloudinary config
|   |-- controllers/     # Request handlers
|   |-- middlewares/     # Auth and upload middleware
|   |-- models/          # PostgreSQL data access
|   |-- realtime/        # Socket.IO setup
|   |-- routes/          # API route modules
|   |-- uploads/         # Local uploaded files
|   `-- server.js        # App entry point
|-- frontend/
|   |-- pages/           # Public pages (index, login, article, profile, ...)
|   |-- dashboard/       # Admin dashboard UI
|   |-- assets/          # CSS, JS, images, i18n
|   `-- components/      # Header/footer
|-- package.json
`-- README.md
```

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL
- Cloudinary account (for upload endpoints)
- Gmail app password (for forgot-password email flow)

## Environment Variables

Create a `.env` file in the repository root.

```env
# Server
PORT=5501
NODE_ENV=development
CLIENT_URL=http://localhost:5501/pages

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_access_secret
JWT_EXPIRE=30m
JWT_REFRESH_KEY=your_refresh_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Mail (forgot password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

Important notes:

- The code reads `DB_HOST`, not `DB_SERVER`.
- Frontend scripts are mostly hardcoded to `http://localhost:5501`, so keep `PORT=5501` for local development.
- `CLIENT_URL` should point to the frontend pages host used in reset-password links.

## Installation

```bash
npm install
```

## Run Locally

Development mode (auto-reload):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

When the server starts, it serves frontend files and opens:

- `http://localhost:5501/pages/index.html`

Useful pages:

- Main site: `http://localhost:5501/pages/index.html`
- Login: `http://localhost:5501/pages/login.html`
- Admin dashboard: `http://localhost:5501/dashboard/index.html`

## Available Scripts

- `npm run dev`: run backend with `nodemon`
- `npm start`: run backend with `node`
- `npm test`: placeholder (no tests configured)

## API Overview

Base URL: `http://localhost:5501`

- Auth: `/api/auth/*`
  - `POST /signup`, `POST /signin`, `POST /refresh`, `POST /logout`
  - `POST /forgot-password`, `POST /reset-password`, `POST /verify-password`
- Users: `/api/users/*`
  - list/detail/update/delete/change-password/change-avatar
- Posts: `/api/posts/*`
  - list, search, latest, get by id/slug, create, update, delete
  - approve/reject/unapprove, record views, related/by-parent, by-author
- Categories: `/api/categories/*`
  - create/list/detail/update/delete
- Comments: `/api/comments/*`
  - list/detail/by-post/create/approve/reject/delete/vote/by-user
- Notifications: `/api/noti/*`
- Author registration: `/api/register-author`, `/api/author-registrations/*`
- Saved posts: `/api/save/:postId`, `/api/saved`, `/api/unsave/:postId`
- Viewed posts: `/api/viewed-posts/user/:userId`
- User settings: `/api/user-settings`
- Homepage settings: `/api/homepage-settings`
- Cloudinary upload endpoint: `POST /api/uploads?folder=<name>`

## Database Notes

This repository does not include migration or seed SQL files. You need an existing PostgreSQL schema (or create one) with tables used by the models, including:

- `users`, `posts`, `categories`, `post_categories`
- `hashtags`, `post_hashtags`
- `comments`
- `notifications`
- `saved_posts`, `viewed_posts`
- `author_registrations`, `author_registration_topics`
- `user_settings`, `homepage_settings`

## Realtime Events

Socket.IO is attached to the same HTTP server.

- Client emits: `send_message`
- Server broadcasts: `receive_message`

## Current Limitations

- Refresh tokens are stored in memory and reset on server restart.
- CORS origin is hardcoded in backend to `http://localhost:5501`.
- No automated tests are configured.

## Security and Deployment Notes

- Set strong secrets for JWT and mail credentials.
- In production, configure HTTPS and secure cookie settings.
- Restrict allowed CORS origins to trusted domains.
- Do not commit `.env` or sensitive keys.
