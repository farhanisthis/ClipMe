# ClipMe Application

## Overview

ClipMe is a web application that allows users to share clipboard text across devices using simple 4-character codes called "ClipTags". Users can enter a ClipTag to access a shared clipboard space where they can sync text content between different devices.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Updates (July 31, 2025)

### Content History Feature
- Added persistent content history that keeps all fetched content visible
- Each content item has its own container with individual copy buttons
- Content history prevents duplication of identical content
- Improved user experience for tracking multiple clipboard syncs

### Dark Mode Implementation
- Full dark mode support with system preference detection
- Theme toggle button in top-right corner of all pages
- Smooth transitions between light and dark themes
- Improved contrast and visibility in dark mode
- Dark mode styling for all components including cards, inputs, and modals

### Mobile QR Scanner
- QR code scanner for mobile devices only
- Camera access with back-facing camera preference
- Manual ClipTag entry fallback for non-mobile devices
- Visual scanning guide with corner indicators
- Proper error handling for camera permissions

### Brand Enhancement (July 31, 2025)
- Renamed from "ClipSync" to "ClipMe" with complete rebranding
- Custom gradient logo with glassmorphism effects
- Beautiful animated backgrounds with radial gradients
- Floating particle animations on home page
- Glassmorphism UI design with backdrop blur effects
- Gradient text styling for brand name throughout app

### Enhanced Input Experience (July 31, 2025)
- Replaced single input with 4 separate character boxes
- Auto-focus navigation between input boxes
- Auto-login when all 4 characters are entered
- Backspace navigation to move to previous box
- Paste support that fills all 4 boxes at once
- Updated QR scanner with same 4-box input format
- Added "Paste & Sync" button for direct clipboard pasting and syncing

### Modern UI & Mobile Enhancement (July 31, 2025)
- Enhanced glassmorphism design with improved backdrop blur effects
- Better mobile responsiveness with optimized touch targets
- Modernized animations with hover effects and micro-interactions
- Improved mobile-first responsive design with better spacing
- Enhanced scrollbar styling and visual feedback
- Sticky header with mobile-optimized navigation
- Better button layouts for mobile with full-width options
- Enhanced visual hierarchy with better contrast and typography
- Improved dark mode with premium dark blue color palette
- Better contrast ratios and readability in dark theme
- Enhanced dark mode glassmorphism effects with blue tones

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
- **QR Code Modal**: Generates QR codes for easy room sharing with dark mode support
- **QR Scanner**: Mobile-only camera scanner for ClipTags with manual fallback
- **Theme Toggle**: Light/dark mode switcher with system preference detection
- **Content History**: Persistent list of fetched content with individual copy buttons
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