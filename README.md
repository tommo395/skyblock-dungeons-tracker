# Skyblock Dungeons Tracker

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://skyblock-dungeons-tracker.vercel.app/)
[![Made with React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

A comprehensive stat tracking and visualization tool for Hypixel Skyblock Dungeons players. View detailed performance metrics, track progression, and analyze your dungeon statistics with an intuitive and responsive interface.


## 🌟 Features

- **Real-time Data**: Fetch and display up-to-date dungeon statistics for any Hypixel Skyblock player
- **Comprehensive Analytics**: Track catacombs level, class levels, secrets, completions, and more
- **Performance Insights**: View detailed floor-specific metrics including fastest times, best scores, and highest damage
- **Shareable Links**: Easily share player statistics through URL parameters
- **Dungeon Weight**: Custom metric to evaluate overall dungeon progression across multiple factors
- **Mobile-Friendly**: Fully responsive design works seamlessly on devices of all sizes
- **Dark Mode**: Eye-friendly interface for extended gaming sessions

## 📊 Dungeon Weight System

The Skyblock Dungeons Tracker features a unique "Dungeon Weight" scoring system that measures overall dungeon progression on a scale approaching 1000:

- **Catacombs Level**: Up to 300 points - scales linearly with level
- **Class Levels**: Up to 250 points - rewards balanced class progression
- **Secrets Found**: Up to 200 points - logarithmic scaling
- **Completions**: Up to 150 points - logarithmic scaling
- **Master Mode**: Up to 50 points - varies based on floor difficulty
- **Perfect Scores**: Up to 20 points - bonus for S+ completions
- **All Floors**: 30 points bonus for completing all floor types

This system provides a comprehensive single-number metric that accurately represents progression from early to endgame.

## 🚀 Getting Started

### Live Demo

The easiest way to use the tracker is through the live deployment:
[https://skyblock-dungeons-tracker.vercel.app/](https://skyblock-dungeons-tracker.vercel.app/)

### Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/skyblock-dungeons-tracker.git
   cd skyblock-dungeons-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## 🔧 Tech Stack

- **Frontend**: React.js, Tailwind CSS
- **API Integration**: Fetch API with sky.shiiyu.moe API
- **Visualization**: Custom React components
- **Deployment**: Vercel

## 📱 Usage Examples

### View Player Stats
- Enter any valid Hypixel Skyblock player IGN in the search bar
- Click search or press Enter
- View comprehensive statistics organized by category

### Share Player Stats
- Search for a player to load their stats
- Copy the URL (automatically updated with player name parameter)
- Share with friends or discord communities

### Compare Multiple Players
- Open multiple browser tabs with different player stats
- Use the dungeon weight metric as a comparative benchmark

## 🤝 Contributing

Contributions are welcome! If you have ideas for improvements or new features:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- Data provided by the [sky.shiiyu.moe API](https://sky.shiiyu.moe/)
- Inspired by the Hypixel Skyblock community
- Special thanks to the early testers and contributors

---

*This project is not affiliated with Hypixel, Mojang, or Microsoft. All Minecraft and Hypixel Skyblock related content belongs to their respective owners.*

© 2023-2025 Skyblock Dungeons Tracker
