# Bravo

**Bravo** is a client-side, multi-agent AI research assistant built with React, Vite, and the LangChain / LangGraph ecosystem. It combines large language models with autonomous tool-calling (live web search, deterministic calculator, long-term memory store) in an interactive ReAct loop running directly in your browser.

---

## Key Highlights

- **Direct In-Prompt Model Selector**: Switch models seamlessly right from the prompt composer next to the Send button.
- **Autonomous ReAct Agent Loop**: Powered by `@langchain/langgraph` with real-time streaming tokens and tool execution steps.
- **Multi-Provider Support**:
  - **Google Gemini**: Gemini 3.5 Flash, 3.5 Flash-Lite, 3.6 Flash, 2.5 Flash, 2.5 Pro, and experimental preview models.
  - **Groq Cloud**: Llama 3.3 70B Versatile, Llama 3.1 8B Instant, GPT-OSS 120B, and lightweight open models.
- **Autonomous Tools**:
  - 🔍 **Live Web Search**: Real-time web search and citation synthesis via Tavily.
  - 🧮 **Accurate Calculator**: Deterministic mathematical arithmetic.
  - 🧠 **Persistent Long-Term Memory**: Stores facts and preferences across conversations using a local store.
  - 🕒 **System & Time Context**: Contextual local date and time.
- **100% Client-Side & Private**: API keys, chat histories, and long-term memories stay entirely within your local browser storage (`localStorage`). No middleman server.
- **First-Time Interactive Onboarding Walkthrough**: Introduces new users to Bravo's features, architecture, privacy model, and guides them directly to configure their API key in Settings.
- **Minimalist, Distraction-Free UI**:
  - Clean desktop layout without top navbars.
  - Smooth mobile hamburger drawer navigation.
  - System default theme with Light, Dark, and System options in Settings.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (v18 or higher; v20+ recommended)
- An API key for your preferred provider:
  - Free [Google Gemini API Key](https://aistudio.google.com/apikey) (Recommended)
  - Free [Groq API Key](https://console.groq.com/keys)
  - Optional [Tavily API Key](https://app.tavily.com/home) for live web search

### Installation & Local Run

```bash
# 1. Clone repository
git clone https://github.com/aadisthunder/Gyani-AI.git
cd Gyani-AI/app

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open your browser at `http://localhost:5173`. When launching for the first time, Bravo greets you with an onboarding tour guiding you to set up your API key in Settings.

---

## Running Tests & Building

```bash
# Run unit and regression tests
npm test

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## Project Structure

```
app/
├── index.html                   # HTML entry point
├── package.json                 # Project dependencies and scripts
├── vite.config.js               # Vite configuration
├── tests/
│   ├── onboarding_and_models.test.js  # Onboarding and model helper tests
│   └── settings_theme.test.js         # Settings and theme persistence tests
└── src/
    ├── main.jsx                 # React root bootstrap
    ├── App.jsx                  # Main application state and view router
    ├── index.css                # Design system tokens and baseline styles
    ├── components/
    │   ├── ChatView.jsx         # Chat interface, prompt composer, model selector
    │   ├── ChatView.css         # Chat layout and model popover styles
    │   ├── OnboardingModal.jsx  # Multi-step welcome and setup walkthrough
    │   ├── OnboardingModal.css  # Onboarding popup modal styles
    │   ├── Sidebar.jsx          # Chat history and navigation sidebar
    │   ├── Sidebar.css          # Sidebar styles and mobile drawer animation
    │   ├── SettingsView.jsx     # Provider, model, API keys, memory, and theme settings
    │   ├── SettingsView.css     # Settings view styles
    │   └── Message.jsx          # Markdown message and tool execution renderer
    └── lib/
        ├── agent.js             # LangGraph ReAct agent loop and store
        ├── constants.js         # Model definitions, providers, default settings
        ├── models.js            # Provider client instantiations and key validation
        ├── onboarding.js        # Onboarding state and model helper functions
        ├── settings.js          # Settings persistence with localStorage migration
        └── theme.js             # Theme initialization and system listener
```

---

## Author

Made by **Aaditya Parkash**

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
