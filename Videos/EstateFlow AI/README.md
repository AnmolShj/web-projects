# Realtor Lead Engine 🏠🚀

An AI-powered platform designed to help real estate agents automate their marketing, capture high-quality leads, and manage their property listings with ease.

## 🌟 Key Features

### 🎥 AI Reel Generator
- Generate professional 20-30 second marketing videos for properties.
- Automated script generation and background music selection.
- Seamless transitions and professional voiceovers (Male/Female options).

### 📝 AI Listing Generator
- Create high-converting property descriptions for MLS, Instagram, Facebook, and Email.
- One-click generation based on property details and images.
- Automatic creation of public landing pages for every listing.

### 🤖 Intelligent LeadBot
- 24/7 AI-powered property assistant embedded on landing pages.
- Automatically captures lead information (Name, Email, Phone) and property interests.
- Natural language follow-up and showing scheduling.

### 📊 Market Insights & Reports
- Automated neighborhood research using AI search tools.
- Professional PDF-style market reports for sellers and buyers.
- Real-time data on average prices, inventory, and sales volume.

### 🛋️ Virtual Staging
- AI-driven virtual staging for empty property photos.
- Multiple styles: Modern, Scandinavian, Industrial, and Traditional.
- Realistic furniture placement to help buyers visualize the space.

### 📈 Lead Management Dashboard
- Centralized tracking of all captured leads and their sources.
- Status management (New, Contacted, Qualified, Closed, Lost).
- Internal notes and automated follow-up rules.

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Motion (for animations).
- **Backend:** Firebase (Authentication, Firestore).
- **AI Models:** Google Gemini 3.1 Pro/Flash (Text, Image, and Search grounding).
- **Icons:** Lucide React.
- **Notifications:** Sonner (Toasts).

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Firebase Project
- Google Gemini API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AnmolShj/AI-ML-Projects.git
   cd AI-ML-Projects
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory and add your API keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Set up Firebase:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/).
   - Enable Firestore and Authentication (Google Login).
   - Add your Firebase configuration to `src/firebase.ts` or `firebase-applet-config.json`.

5. Start the development server:
   ```bash
   npm run dev
   ```

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---
*Developed by Anmol Sharma*
