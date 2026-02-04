# 🚀 Social Network Project

Welcome to the **Social Network** monorepo! This project is a modern, full-stack social media application designed with scalability, performance, and best practices in mind, including adherence to **SOLID principles**.

It consists of two main parts: a high-performance **Frontend** and a robust **Backend**.

## 🏗️ Project Structure

- **[Frontend (Mobile-First Web App)](./frontend/README.md)**
  - Built with **Next.js 16**, **React 19**, and **Tailwind CSS**.
  - Features optimistic UI updates using **TanStack Query**.
  - Includes a comprehensive design system with **Radix UI** primitives.

- **[Backend (RESTful API)](./backend/README.md)**
  - Built with **Node.js**, **Express**, and **TypeScript**.
  - Utilizes **MongoDB** with **Mongoose** for data modeling.
  - Implements secure **JWT Authentication** and **Google OAuth**.

## 🎯 Key Design Principles

Both applications are architected following **SOLID principles** to ensure:

- **Maintainability**: Code that is easy to read, understand, and update.
- **Scalability**: An architecture that grows with the feature set without accumulating technical debt.
- **Robustness**: Strong typing with TypeScript across the entire stack.

## 🚀 Quick Start

To get up and running, you will need to set up both the frontend and backend.

1.  **Backend Setup**: Go to the [`backend/`](./backend/README.md) directory and follow the setup instructions to get the API running on port `4000`.
2.  **Frontend Setup**: Go to the [`frontend/`](./frontend/README.md) directory and follow the instructions to start the development server on port `3000`.

Check the individual `README.md` files in each directory for detailed documentation on environment variables, scripts, and architecture deeper dives.
