# 🛡️ SafeLife AI

A comprehensive personal safety application powered by artificial intelligence, combining a robust backend with a modern mobile interface for real-time safety monitoring and emergency response.

## 📋 Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- **Real-time Safety Monitoring**: AI-powered threat detection and alerts
- **Mobile-First Design**: Native mobile app built with React Native and Expo
- **Secure Backend**: Express.js server with robust API endpoints
- **User Authentication**: Secure login and registration system
- **Emergency Response**: Quick access to emergency services
- **Location Tracking**: GPS-based safety features
- **Tactical Alerts**: Real-time notification system for threats

## 📁 Project Structure

```
SafeLife AI/
├── Backend/                 # Node.js/Express server
│   ├── server.js           # Main server entry point
│   └── package.json        # Backend dependencies
├── mobile-app/             # React Native Expo app
│   ├── app/                # App screens and navigation
│   ├── components/         # Reusable UI components
│   ├── constants/          # App constants and theme
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   └── package.json        # Mobile app dependencies
├── package.json            # Root configuration
├── DEPLOYMENT_CHECKLIST.md # Deployment guidelines
└── PRODUCTION_UPGRADE_GUIDE.md # Production upgrade steps
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Middleware**: CORS, Body Parser
- **Database**: Supabase PostgreSQL

### Mobile App
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Build Tool**: Babel, ESLint
- **Navigation**: Expo Router
- **UI Components**: Custom themed components

### Development Tools
- **Package Manager**: npm
- **Task Runner**: Concurrently
- **Linter**: ESLint
- **Formatter**: Configured with ESLint

## 🚀 Installation

### Prerequisites
- Node.js 16+ and npm
- Expo CLI (`npm install -g expo-cli`)
- Git
- A Supabase account (for database)

### Clone Repository

```bash
git clone https://github.com/rish0000-dot/Saftey-App.git
cd "SafeLife AI"
```

### Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd Backend
npm install
cd ..

# Install mobile app dependencies
cd mobile-app
npm install
cd ..
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `Backend` directory:

```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
NODE_ENV=development
```

Create a `.env.local` file in the `mobile-app` directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

## 💻 Getting Started

### Development Mode

Start both backend and mobile app simultaneously:

```bash
npm run dev
```

This will:
- Start the Express backend on `http://localhost:5000`
- Open Expo Metro Bundler for the mobile app

### Backend Only

```bash
npm run backend
```

Runs on `http://localhost:5000`

### Mobile App Only

```bash
npm run frontend
```

Starts Expo Metro Bundler

### Testing

```bash
npm test
```

## 📱 App Navigation

- **Login Screen**: User authentication
- **Registration Screen**: New user onboarding
- **Home Tab**: Main dashboard and safety status
- **Explore Tab**: Browse safety resources
- **Modal**: Additional information and settings

## 🔐 Security Features

- Secure user authentication
- Encrypted data transmission
- CORS protection
- Environment-based configuration

## 📦 Deployment

### Production Checklist

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for detailed deployment steps.

### Production Upgrade

See [PRODUCTION_UPGRADE_GUIDE.md](./PRODUCTION_UPGRADE_GUIDE.md) for upgrade procedures.

### Backend Deployment

1. Build and optimize the Express server
2. Deploy to hosting platform (Heroku, AWS, DigitalOcean, Vercel)
3. Configure environment variables
4. Set up database backups

### Mobile App Deployment

1. Create production build:
   ```bash
   cd mobile-app
   eas build --platform ios --auto-submit
   eas build --platform android --auto-submit
   ```

2. Submit to App Store and Google Play

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/YourFeature`)
2. Commit changes (`git commit -m 'Add YourFeature'`)
3. Push to branch (`git push origin feature/YourFeature`)
4. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the License in package.json for details.

## 👨‍💻 Author

SafeLife Development Team

## 📞 Support

For support, issues, or feature requests, please open an issue on the [GitHub repository](https://github.com/rish0000-dot/Saftey-App.git).

---

**Built with ❤️ for your safety**
