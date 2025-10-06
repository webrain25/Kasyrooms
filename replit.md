# Overview

This is a video chat platform called "Kasynoir Live" that connects users with live models. The application is built as a full-stack TypeScript application using Express.js for the backend and React with Vite for the frontend. It features a modern UI with dark theme, model browsing capabilities, filtering options, and VIP membership features.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework & Build System**: The frontend uses React 18 with TypeScript, built and bundled using Vite. The application uses Wouter for client-side routing instead of React Router, providing a lightweight routing solution.

**UI Component System**: The application leverages Shadcn UI components (based on Radix UI primitives) with a "new-york" style configuration. Components are styled using Tailwind CSS with CSS variables for theming, enabling a consistent dark theme throughout the application. The design system uses a gold accent color (#D4A044) as the primary brand color against a dark neutral background.

**State Management**: Client-side data fetching and caching is handled by TanStack Query (React Query). The query client is configured with infinite stale time and disabled automatic refetching, giving full control over when data updates occur. API requests are made through a custom `apiRequest` wrapper function that handles JSON serialization and error handling.

**Component Structure**: The application follows a modular component architecture with separate directories for UI primitives (`components/ui/`) and feature components (`components/`). Key feature components include:
- Header with search and navigation
- Hero carousel for promotional content
- Category filters for model discovery
- Model grid with card-based layout
- VIP promotion section
- Footer with links and social media

## Backend Architecture

**Server Framework**: The backend uses Express.js with TypeScript, running in ESM module mode. The server implements custom middleware for request logging, JSON body parsing with raw body preservation (for webhook verification), and comprehensive error handling.

**Development vs Production**: In development mode, the application uses Vite's middleware mode for HMR (Hot Module Replacement) and serves the React application directly. In production, static files are served from the built `dist/public` directory.

**API Design**: The REST API follows conventional patterns with endpoints structured under `/api/` prefix:
- `GET /api/models` - List models with optional filters (online, vip, new)
- `GET /api/models/:id` - Get specific model details
- `GET /api/stats/online-count` - Get count of online models
- `PATCH /api/models/:id/status` - Update model online status

**Data Storage**: Currently implements an in-memory storage solution (`MemStorage` class) for development and demonstration purposes. The storage layer is abstracted through an `IStorage` interface, making it easy to swap implementations. Sample data is automatically initialized with demo models on startup.

## Database Schema

**ORM & Database**: The application is configured to use Drizzle ORM with PostgreSQL (via Neon serverless driver). The schema is defined in TypeScript using Drizzle's declarative API.

**Tables**:
- `users` - User authentication with username/password
- `models` - Model profiles with attributes like name, age, country, languages, specialties, online status, VIP status, ratings, and viewer counts

**Type Safety**: Drizzle-Zod integration provides runtime validation schemas derived from database schemas, ensuring type safety across the full stack. Insert schemas exclude auto-generated fields (id, createdAt).

**Migration Strategy**: Database migrations are managed via Drizzle Kit, with migrations stored in the `/migrations` directory. The configuration uses PostgreSQL dialect and expects a `DATABASE_URL` environment variable.

## External Dependencies

**UI & Component Libraries**:
- Radix UI - Accessible component primitives (dialogs, dropdowns, accordions, etc.)
- Tailwind CSS - Utility-first CSS framework
- Shadcn UI - Pre-built component system
- Embla Carousel - Carousel/slider functionality
- Lucide React - Icon library
- Font Awesome - Additional icons (loaded via CDN)

**Data Fetching & Forms**:
- TanStack Query - Server state management and data fetching
- React Hook Form - Form state management
- Zod - Schema validation
- @hookform/resolvers - Form validation integration

**Database & Backend**:
- Drizzle ORM - TypeScript ORM
- @neondatabase/serverless - PostgreSQL serverless driver
- connect-pg-simple - PostgreSQL session store (for future authentication)

**Development Tools**:
- Vite - Build tool and dev server
- TypeScript - Type system
- ESBuild - Production bundler for server code
- Replit plugins - Development tooling for Replit environment

**Date & Utilities**:
- date-fns - Date manipulation library
- clsx & tailwind-merge - Conditional className utilities
- nanoid - ID generation

**Authentication Foundation**: The application includes schema definitions for user authentication (username/password) and session management infrastructure (connect-pg-simple), though authentication flows are not yet fully implemented in the codebase.