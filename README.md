# VFit: Smart Fitness App 🏋️‍♂️

[Open the App](https://vfit.netlify.app/)

## Screenshots

|![Activity](https://github.com/user-attachments/assets/6ef890af-21dc-4362-9564-a2921251f5a7)|![Create Workout](https://github.com/user-attachments/assets/90a1ea09-6e03-44f4-a888-1b44228e2ff9)|![Workout](https://github.com/user-attachments/assets/c73c6207-da73-450b-a71f-b5a61590d3aa)|![Workout](https://github.com/user-attachments/assets/1c0bc3f0-3aa1-4a41-9126-77a635910f25)|![Workout](https://github.com/user-attachments/assets/4716ea41-fb58-466b-bf77-4b23a76325a7)|
|-|-|-|-|-|

## Features
- Create Workouts (very customizable - many more parameters than the offical app are exposed in what I think is a fairly user-friendly way)
- Partner workouts (select which users are working out, will go 1:1 and change both the app color scheme and trainer color to indicate whose turn it is)
- Workout modes (mostly match up with the Echo/Pump/OldSchool/TuT, but I have some extra ones I've been experimenting with)
- Audio Cues
- Workout Tracking
- Performance Tracking (records best efforts per exercise)
- 1RM Estimation (I use a formula based on Lombardi that allows inputting variable weights per rep so it works on things like TuT/Echo - it's not perfect but also not half bad)

### PWA Installation

The app is configured as a Progressive Web App (PWA) and can be installed on mobile devices:

1. Open the app in a supported browser
2. Look for "Install App" or "Add to Home Screen" prompt
3. Follow browser-specific installation steps

## How I've been using it

The app has evolved around the way I've been using it.  I have the Trainer next to my desk. The idea was to have something I could just pick up do a few sets and then return to work.

- It just remembers the last workout, but if you stop mid workout it will pickup where you left off
- There's an auto progression system where it increases the weight of a set the next time you do it (by roughly 1%)
- When there are multiple users (partner workout), the weights of the second (and third, etc.) are based on 1RM%

## Areas to improve

- Only one saved workout. Definitely an area for improvement.
- Users are currently hard coded
- Limited exercise selection. We should pull in the full Vitrivian library.
- Cross-device data syncing requires you to point to your own couchdb instance - not very user friendly. It also doesn't seem to scale well. It has started to choke when syncing my full workout history to a new device.

## 🛠️ Tech Stack

- **Frontend**: SolidJS + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Database**: PouchDB (local storage)
- **Charts**: Chart.js + Solid-ChartJS
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

Storybook is used for isolated component development. Each component has corresponding `.stories.tsx` files:

```bash
npm run dev  # Start Storybook
```

### Device Settings

Bluetooth device configuration is handled in `services/device/`. Modify connection parameters in:

- `services/device/index.ts` - Main device service
- `services/device/cables.ts` - Cable resistance parsing
- `services/device/mode.ts` - Training mode configuration

### Device Playground

Under the "Manual" tab at the bottom you have a playground that gives raw access to the 3 commands that control the Trainer.  You can use these to test new modes and such.

|![Activate](https://github.com/user-attachments/assets/5584efae-fed3-46ab-85d4-4a6e515db976)|![Echo](https://github.com/user-attachments/assets/23a57d9e-19c2-4e44-80b7-e94d46154c44)|![Regular](https://github.com/user-attachments/assets/d2a73b81-374e-4ba7-86d3-5905f651dc7c)|
|-|-|-|

## 🤝 Contributing

Contributions welcome! Please follow these steps:

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

