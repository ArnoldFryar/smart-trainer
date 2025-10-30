# VFit: Smart Fitness App 🏋️‍♂️

A modern, progressive web application for smart fitness tracking with Bluetooth device integration. Built with SolidJS, TypeScript, and Vite.

## 🌟 Features

- **Bluetooth Device Integration**: Connect to smart fitness equipment via Web Bluetooth API
- **Workout Tracking**: Track exercises, sets, reps, and performance metrics
- **Real-time Analytics**: Analyze exercise form and performance data
- **Progressive Web App**: Install on mobile devices for native app experience
- **Multiple Training Modes**: Support for various training styles (Echo, Pump, Old School, Chains, etc.)
- **Exercise Database**: Comprehensive exercise library with demonstrations
- **Workout History**: Track progress over time with detailed analytics
- **Modern UI**: Beautiful, responsive interface built with TailwindCSS

## 🛠️ Tech Stack

- **Frontend**: SolidJS + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS + PostCSS
- **Database**: PouchDB (local storage)
- **Charts**: Chart.js + Solid-ChartJS
- **State Management**: XState
- **Development**: Storybook for component development
- **PWA**: Service Worker support with manifest

## 🚀 Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- A modern browser with Web Bluetooth support (Chrome, Edge, Opera)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-fitness
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev-server
   ```
   
   The app will be available at `https://localhost:5173` (HTTPS is required for Web Bluetooth API)

4. **Start Storybook (for component development)**
   ```bash
   npm run dev
   ```
   
   Storybook will be available at `http://localhost:6006`

### Available Scripts

- `npm run dev` - Start Storybook development server
- `npm run dev-server` - Start Vite development server
- `npm run build` - Build for production
- `npm run build-storybook` - Build Storybook for production
- `npm run serve` - Preview production build

## 📱 Device Compatibility

The app connects to smart fitness devices via Bluetooth Low Energy (BLE). Supported features include:

- **Cable Resistance Monitoring**: Track left and right cable resistance
- **Rep Counting**: Automatic repetition detection
- **Exercise Modes**: Multiple training modes with different resistance curves
- **Real-time Feedback**: Live performance metrics during workouts

### Browser Requirements

- Chrome 56+ / Edge 79+ / Opera 43+ (Web Bluetooth support required)
- HTTPS connection (required for Web Bluetooth API)

## 🏗️ Project Structure

```
├── data/                   # Static data (exercises, categories)
├── services/              # Business logic and utilities
│   ├── db/               # Database services (PouchDB)
│   ├── device/           # Bluetooth device integration
│   ├── user/             # User preferences and settings
│   ├── util/             # Shared utilities
│   └── workout/          # Workout logic and management
├── ui/                   # Frontend components and pages
│   ├── _common/          # Shared UI components
│   ├── _public/          # Static assets and PWA files
│   ├── Activity/         # Activity tracking components
│   ├── AnalyzeExercise/  # Exercise analysis views
│   ├── AnalyzeSet/       # Set analysis components
│   ├── App/              # Main app component
│   ├── Manual/           # Manual entry components
│   ├── Settings/         # Settings and preferences
│   └── Workout/          # Workout-related components
└── Configuration files    # Vite, TypeScript, Tailwind configs
```

## 🧪 Development

### Component Development with Storybook

We use Storybook for isolated component development. Each component has corresponding `.stories.tsx` files:

```bash
npm run dev  # Start Storybook
```

### Code Style

- **TypeScript**: Strict typing enabled
- **SolidJS**: Reactive programming with signals
- **Functional Components**: Prefer function components over classes
- **CSS**: TailwindCSS utility classes

### Adding New Components

1. Create component in appropriate directory under `ui/`
2. Add corresponding `.stories.tsx` file for Storybook
3. Export from parent directory's index file
4. Follow existing naming conventions

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### PWA Installation

The app is configured as a Progressive Web App (PWA) and can be installed on mobile devices:

1. Open the app in a supported browser
2. Look for "Install App" or "Add to Home Screen" prompt
3. Follow browser-specific installation steps

## 🔧 Configuration

### Environment Variables

The app uses Vite's environment variable system. Create `.env.local` for local overrides:

```bash
# Add any environment-specific variables here
VITE_API_URL=your-api-url
```

### Device Settings

Bluetooth device configuration is handled in `services/device/`. Modify connection parameters in:

- `services/device/index.ts` - Main device service
- `services/device/cables.ts` - Cable resistance parsing
- `services/device/mode.ts` - Training mode configuration

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### Getting Started

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation as needed

4. **Test your changes**
   ```bash
   npm run build  # Ensure it builds
   npm run dev    # Test in Storybook
   ```

5. **Commit your changes**
   ```bash
   git commit -m "feat: add your feature description"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**

### Contribution Guidelines

- **Code Quality**: Ensure TypeScript compilation passes without errors
- **Component Stories**: Add Storybook stories for new UI components
- **Documentation**: Update README and code comments as needed
- **Commit Messages**: Use conventional commit format (`feat:`, `fix:`, `docs:`, etc.)
- **Testing**: Test Bluetooth functionality when possible

### Areas for Contribution

- **New Exercise Types**: Add support for additional exercises
- **Device Integration**: Improve Bluetooth device compatibility
- **UI/UX Improvements**: Enhance user interface and experience
- **Performance**: Optimize app performance and bundle size
- **Accessibility**: Improve accessibility features
- **Documentation**: Improve code documentation and guides

## 📄 License

[Add your license information here]

## 🐛 Issues and Support

If you encounter any issues or have questions:

1. Check existing issues in the repository
2. Create a new issue with detailed description
3. Include browser version and device information for Bluetooth-related issues

## 🙏 Acknowledgments

- Built with [SolidJS](https://www.solidjs.com/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Bundled with [Vite](https://vitejs.dev/)
- Component development with [Storybook](https://storybook.js.org/)
