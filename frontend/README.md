# 🎨 Social Network Frontend

A modern, responsive, and high-performance web interface for the Social Network application, built with **Next.js 16**, **React 19**, and **Tailwind CSS v4**. It features a smooth user experience with optimistic UI updates and robust state management.

## ✨ Features

- **Next.js App Router**: Utilizing the latest file-system based routing and Server Components.
- **Responsive Design**: Mobile-first approach using Tailwind CSS.
- **Authentication**: Secure login/signup flows including Google OAuth integration.
- **Real-time-like Experience**: Optimistic updates using TanStack Query.
- **Rich Interactions**: Animations powered by Framer Motion and standard CSS transitions.
- **Interactive UI**: Components built with Radix UI primitives for accessibility.
- **Reply Sorting**: Toggle between "Top" and "Recent" replies in thread views with optimized recursive fetching.

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching**: [TanStack Query v5](https://tanstack.com/query/latest)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📂 Project Structure

It follows a feature-first and modular structure inside the `app` directory.

```
frontend/
├── 📂 app/               # Next.js App Router pages & layouts
│   ├── 📂 (auth)/        # Auth routes group (login, signup)
│   ├── 📂 feed/          # Main feed page
│   ├── 📂 profile/       # User profile pages
│   └── ...
├── 📂 components/        # Reusable UI components
├── 📂 services/          # API integration layer (Axios)
├── 📂 shared/            # Shared utilities, hooks, types, & constants
│   ├── 📂 hooks/         # Custom React hooks
│   ├── 📂 types/         # TypeScript definitions
│   └── 📂 lib/           # Utils (Axios instance, utils)
├── 📂 store/             # Global state (Zustand stores)
└── ...
```

## 🛠️ Installation & Setup

### Prerequisites

Ensure you have the following installed:

- **Node.js** (v20+)
- **pnpm** (Recommended) or npm/yarn

### 1. Installation

```bash
cd frontend
pnpm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root of the frontend directory.

```env
# API Connection
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api

# Authentication (Google)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 3. Running the App

**Development Server**:

```bash
pnpm dev
# Open http://localhost:3000 to view it in the browser.
```

**Production Build**:

```bash
pnpm build
pnpm start
```

## 📐 Architecture & Patterns

### 🏗️ SOLID Principles

We adhere to SOLID principles to keep the frontend maintainable:

- **Single Responsibility**: Components are small, focused, and perform one functionality. Hooks encapsulate specific logic (e.g., data fetching, form handling).
- **Dependency Inversion**: Services are decoupled from UI components. We rely on abstract interfaces for API responses rather than hardcoding logic inside components.

### 🔄 Silent Refresh Mechanism (Axios Interceptors)

We implemented a **Silent Refresh** strategy to ensure a seamless user experience:

1.  **Automatic Token Attachment**: An Axios Request Interceptor attaches the `Access Token` to every outgoing request.
2.  **Graceful 401 Handling**: An Axios Response Interceptor catches `401 Unauthorized` errors.
3.  **Token Refresh**:
    - It pauses the failed request and adds it to a `failedQueue`.
    - It calls the `/api/auth/refresh` endpoint behind the scenes (sending the HttpOnly cookie).
    - Upon success, it updates the Access Token in memory and retries all queued requests.
    - The user never realizes their session was about to expire.

### Other Patterns

- **Server & Client Components**: Usage of Server Components for initial data and Client Components for interactivity.
- **Optimistic UI**: React Query mutations update the UI _immediately_ (e.g., liking a post) while the server request processes.
- **Global State**: `Zustand` handles lightweight global state like the User Session.
- **Tailwind v4**: Latest engine for high-performance styling.

## 📦 Scripts

- `pnpm dev`: Runs the application in development mode.
- `pnpm build`: Builds the application for production.
- `pnpm start`: Starts the production build.
- `pnpm lint`: Runs ESLint to ensure code quality.

## 🤝 Contributing

We welcome contributions! Please ensure you:

1.  Follow the existing directory structure.
2.  Use strong typing (TypeScript).
3.  Keep components small and focused.
