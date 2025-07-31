# ClipSync Application

## Overview

ClipSync is a web application that allows users to share clipboard text across devices using simple 4-character codes called "ClipTags". Users can enter a ClipTag to access a shared clipboard space where they can sync text content between different devices.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Pattern**: RESTful API with JSON responses
- **Session Management**: Connect-pg-simple for PostgreSQL-backed sessions

### Development Setup
- **Monorepo Structure**: Client, server, and shared code in separate directories
- **Hot Reload**: Vite dev server with HMR for frontend development
- **Development Mode**: Express server with automatic TypeScript compilation via tsx

## Key Components

### Database Schema
- **Users Table**: Stores user credentials with UUID primary keys
- **Clipboards Table**: Stores ClipTag-content pairs with timestamps
- **Validation**: Drizzle-Zod integration for runtime schema validation

### API Endpoints
- `GET /api/clip/:tag` - Retrieve clipboard content by ClipTag
- `POST /api/clip/:tag` - Create or update clipboard content for a ClipTag

### Frontend Pages
- **Home Page**: ClipTag input form and application introduction
- **Room Page**: Main clipboard interface for sharing and syncing content
- **404 Page**: Error handling for invalid routes

### UI Components
- **QR Code Modal**: Generates QR codes for easy room sharing
- **Toast Notifications**: User feedback for actions and errors
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

## Data Flow

1. **ClipTag Entry**: Users enter a 4-character alphanumeric code on the home page
2. **Room Access**: Application navigates to `/room/:tag` route
3. **Content Retrieval**: React Query fetches existing content from `/api/clip/:tag`
4. **Content Sync**: Users can update content via POST requests to the same endpoint
5. **Real-time Updates**: Manual refresh mechanism for checking latest content
6. **QR Code Sharing**: Generate shareable QR codes for room URLs

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection**: Environment variable `DATABASE_URL` required
- **Migration**: Drizzle Kit for schema management

### Development Tools
- **Replit Integration**: Special handling for Replit environment
- **Error Overlay**: Runtime error modal for development
- **Cartographer**: Replit-specific development plugin

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **QRCode.react**: QR code generation
- **Embla Carousel**: Carousel component support

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite compiles React app to `dist/public`
2. **Backend Build**: esbuild bundles Express server to `dist/index.js`
3. **Database Setup**: Drizzle migrations applied via `db:push` command

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `NODE_ENV`: Environment mode (development/production)
- `REPLIT_DOMAINS`: Domain configuration for Replit deployment

### Production Server
- **Entry Point**: `dist/index.js`
- **Static Files**: Served from `dist/public`
- **Database**: Connected via environment variable
- **Session Storage**: PostgreSQL-backed sessions for scalability

### Development vs Production
- **Development**: Vite dev server with HMR, tsx for TypeScript execution
- **Production**: Pre-built static files served by Express, compiled JavaScript bundle
- **Error Handling**: Development error overlay vs production error pages