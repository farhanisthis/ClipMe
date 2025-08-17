# ClipMe - Professional Clipboard Sharing

## 🎬 ClipMe

### Description

A Chrome extension and mobile utility crafted by **Farhan Ali**, born from my personal frustration with clipboard syncing.

### Author

Farhan Ali • © 2025

A professional, modern clipboard sharing application that enables seamless content sharing across devices using simple 4-character room codes.

## ✨ Features

### 🎨 Professional UI/UX

- **Modern Design**: Beautiful gradient backgrounds with subtle animations
- **Dark/Light Mode**: Automatic theme switching with persistent preferences
- **Responsive**: Optimized for desktop, tablet, and mobile devices
- **Accessibility**: WCAG compliant with proper focus management
- **Micro-interactions**: Smooth animations powered by Framer Motion

### 🔒 Security & Privacy

- **No Account Required**: Start sharing immediately without registration
- **Auto-Delete Protection**: All content automatically deletes after 15 minutes
- **Temporary Rooms**: Rooms expire automatically for privacy
- **Client-Side Encryption**: Content encrypted before transmission
- **Secure Connections**: HTTPS/WSS in production
- **Zero Persistence**: No permanent storage of your sensitive data

### ⚡ Performance

- **Real-time Sync**: Instant clipboard updates using WebSockets
- **Privacy-First**: 15-minute auto-deletion ensures your data never persists
- **Optimized Loading**: Code splitting and lazy loading
- **Professional Caching**: Intelligent data caching strategies
- **Cross-Platform**: Works on any device with a web browser

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/farhanisthis/clipme.git
   cd clipme
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5000`

### Production Deployment

1. **Build the application**

   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 📱 How to Use

### Creating/Joining a Room

1. Enter a 4-character alphanumeric code (A-Z, 0-9)
2. Auto-joins when all 4 characters are entered
3. Share the code with other devices

### Mobile Features

- **QR Code Scanner**: Scan QR codes to join rooms instantly
- **Touch Optimized**: Large touch targets and mobile-first design
- **Offline Support**: Basic functionality works offline

### Desktop Features

- **Keyboard Navigation**: Full keyboard accessibility
- **Paste Support**: Paste room codes directly
- **Multiple Windows**: Open multiple rooms in different tabs

## 🛠 Technical Stack

### Frontend

- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development experience
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Professional animations and micro-interactions
- **Radix UI** - Accessible component primitives
- **Wouter** - Lightweight routing

### Backend

- **Express.js** - Fast, minimal web framework
- **WebSockets** - Real-time bidirectional communication
- **Node.js** - JavaScript runtime environment

### Development Tools

- **Vite** - Lightning fast build tool
- **ESBuild** - Extremely fast JavaScript bundler
- **TSX** - TypeScript execution environment
- **Cross-env** - Cross-platform environment variables

## 🎨 Design System

### Colors

- **Primary**: Blue to Indigo gradient (#3B82F6 → #6366F1)
- **Secondary**: Slate tones for elegant contrast
- **Accent**: Emerald for success states
- **Background**: Professional gradients with glass morphism

### Typography

- **Primary Font**: Inter - Modern, readable sans-serif
- **Code Font**: JetBrains Mono - Developer-friendly monospace
- **Responsive Scaling**: Fluid typography across devices

### Components

- **Cards**: Glass morphism with elegant shadows
- **Buttons**: Gradient backgrounds with hover animations
- **Inputs**: Professional styling with focus states
- **Icons**: Lucide React for consistent iconography

## 📊 Performance Metrics

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3s

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Type check TypeScript
- `npm run db:push` - Push database schema changes
- `npm run audit:fix` - Fix security vulnerabilities

## 📁 Project Structure

```
ClipShareConnect/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and configurations
├── server/                # Backend Express server
├── shared/                # Shared type definitions
└── dist/                  # Production build output
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- **Radix UI** for accessible component primitives
- **Tailwind CSS** for the utility-first CSS framework
- **Framer Motion** for smooth animations
- **Lucide** for beautiful icons

---

Made with ❤️ for seamless clipboard sharing across devices.
