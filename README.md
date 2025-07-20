# Kognys Frontend

![Kognys Logo](public/kognys-logo.png)

An AI-powered DeSci (Decentralized Science) hub that provides intelligent research assistance across multiple scientific domains. Built with React, TypeScript, and modern web technologies.

## 🚀 Features

- **Multi-Domain Science Support**: Interactive chat interface with specialized support for Math, Biology, Physics, Chemistry, AI & Tech, and Research
- **Persistent Chat History**: Save and manage multiple research conversations with local storage
- **Responsive Design**: Optimized for both desktop and mobile experiences
- **Modern UI**: Clean, accessible interface built with shadcn/ui components
- **Real-time Streaming**: Live response streaming for natural conversation flow
- **Research-Focused Suggestions**: Curated prompts for different scientific disciplines

## 🛠 Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Styling**: Tailwind CSS with custom theme configuration
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **API Integration**: Custom Kognys backend integration

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kognys-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:8080`

## 🔧 Available Scripts

```bash
# Start development server (runs on port 8080)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## 🏗 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components (50+ components)
│   ├── ChatInterface/  # Main chat interface
│   ├── SimpleChat/     # Home page chat component
│   ├── ClaudeSidebar/  # Navigation sidebar
│   └── ...
├── hooks/              # Custom React hooks
├── lib/                # Utilities and API clients
│   ├── kognysPaperApi.ts  # Backend API integration
│   ├── chatStore.ts    # Chat persistence logic
│   └── utils.ts
├── pages/              # Route components
│   ├── Index.tsx       # Home page
│   ├── Chat.tsx        # Chat conversation page
│   ├── SimpleChatPage.tsx  # Simplified chat start page
│   └── ...
└── App.tsx             # Main app with routing
```

## 🌐 API Integration

The application integrates with the Kognys backend API:

- **Base URL**: `https://kognys-agents-python-production.up.railway.app`
- **Endpoints**:
  - `POST /papers` - Create a new research paper/conversation
  - `GET /papers/{paper_id}` - Retrieve an existing paper/conversation
- **Authentication**: User ID generated and stored in localStorage

## 🎨 Design System

### Color Scheme
The application uses a sophisticated dark theme with:
- Background colors using CSS custom properties
- Orange accent colors (`orange-500`, `orange-600`) for interactive elements
- Muted foreground colors for secondary text
- Border colors with opacity variations for subtle divisions

### Typography
- Primary font: Inter
- Responsive text sizing with mobile-first approach
- Consistent spacing and line heights

### Components
Built with shadcn/ui providing:
- Accessible form components
- Modal dialogs and dropdowns
- Loading states and animations
- Responsive navigation

## 📱 Routes

- `/` - Home page with hero section and chat interface
- `/chat` - Simplified chat start page with science area suggestions
- `/chat/:chatId` - Individual chat conversation view

## 🔐 Data Storage

- **Chat History**: Stored locally using browser localStorage
- **User Sessions**: Persistent user ID for API authentication
- **Conversation State**: Real-time chat state management with React Query

## 🚀 Deployment

The project is configured for deployment on platforms like Vercel, Netlify, or similar:

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your hosting platform

### Environment Variables

Currently, the API URL is hardcoded in `kognysPaperApi.ts`. For production deployments, consider using environment variables:

```env
VITE_API_BASE_URL=https://your-api-url.com
```

## 🧪 Development Notes

### TypeScript Configuration
- Permissive configuration for rapid development
- Path alias: `@/*` maps to `./src/*`
- No strict null checks (can be enabled for production)

### API Error Handling
- Comprehensive error parsing for API responses
- User-friendly error messages
- Retry logic for failed requests

### Mobile Optimization
- Responsive sidebar with mobile overlay
- Touch-friendly interface elements
- Optimized input handling for mobile devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🔗 Related Links

- [Kognys Documentation](https://aicrypto.gitbook.io/kognys-docs/)
- [Unibase](https://www.unibase.io/)

## 📄 License

This project is proprietary software. All rights reserved.

---

**Powered by [Unibase](https://www.unibase.io/)**