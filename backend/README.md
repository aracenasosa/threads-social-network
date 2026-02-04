# 🌐 Social Network Backend

A robust and scalable RESTful API built with **Node.js**, **Express**, and **TypeScript**, serving as the backbone for the Social Network application. It handles authentication, user management, posts, interactions, and media uploads with a clean, layered architecture.

## 🚀 Technologies & Tools

- **Runtime**: [Node.js](https://nodejs.org/) (v20+)
- **Framework**: [Express.js](https://expressjs.com/) (v5)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [MongoDB](https://www.mongodb.com/) (via [Mongoose](https://mongoosejs.com/) ORM)
- **Authentication**: [JWT](https://jwt.io/) (JSON Web Tokens) & Google OAuth
- **Media Storage**: [Cloudinary](https://cloudinary.com/)
- **Documentation**: [Swagger UI](https://swagger.io/tools/swagger-ui/)
- **Logging**: Morgan

## 📂 Project Architecture

The project follows a **layered architecture** to separate concerns, ensuring maintainability and scalability.

```
src/
├── 📂 config/        # Configuration files (DB connection, Cloudinary, etc.)
├── 📂 controllers/   # Request handlers & business logic
├── 📂 middlewares/   # Custom Express middlewares (Auth, Error handling, Multer)
├── 📂 models/        # Mongoose schemas & data models
├── 📂 routes/        # API route definitions
├── 📂 types/         # TypeScript type definitions and interfaces
├── 📂 utils/         # Helper functions and utilities
└── app.ts            # App entry point
```

## 🛠️ Installation & Setup

### Prerequisites

Ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (Recommended package manager) or npm/yarn
- **MongoDB** (Local or Atlas Cluster)

### 1. Clone the repository

```bash
git clone https://github.com/aracenasosa/social-network.git
cd social-network/backend
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory and configure the following variables.

> **Note**: Never commit your actual `.env` file to version control.

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=<app_name>

# Security (JWT)
ACCESS_TOKEN_SECRET=your_super_secret_access_key
REFRESH_TOKEN_SECRET=your_super_secret_refresh_key
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d

# Third-Party Services
# Cloudinary (Image Uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 4. Running the Server

**Development Mode** (with hot-reload):

```bash
pnpm dev
```

**Production Build**:

```bash
pnpm build
pnpm start
```

## 📡 API Documentation

The API Documentation is auto-generated using **Swagger**.

Once the server is running, visit:
**`http://localhost:4000/api/docs`**

### Main Endpoints

| Resource  | Base Path    | Description                                 |
| :-------- | :----------- | :------------------------------------------ |
| **Auth**  | `/api/auth`  | Login, Signup, Google Auth, Refresh Token   |
| **Users** | `/api/users` | Profile management, Search, Follow/Unfollow |
| **Posts** | `/api/posts` | Create, Read, Delete posts, Feed generation |
| **Likes** | `/api/likes` | Like/Unlike functionality                   |

## 🛡️ Key Practices & Patterns

- **Type Safety**: Extensive use of TypeScript interfaces and types for reliable code.
- **Controller-Service Pattern**: (implicitly implemented in controllers) to separate HTTP concerns from core business logic (ready for extraction to services as operations grow).
- **Security**:
  - passwords hashed with `bcrypt`.
  - JWT validation middleware for protected routes.
  - Google ID token verification.
- **Error Handling**: Centralized error middleware to catch and format exceptions consistently.
- **Validation**: Input validation ensures data integrity before processing.

## 🤝 Contributing

1.  Fork the repository
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
