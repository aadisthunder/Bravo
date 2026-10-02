# Bravo

**Bravo** is a client-side, multi-agent AI research assistant built with React, Vite, and the LangChain / LangGraph ecosystem. It combines large language models with autonomous tool-calling (live web search, deterministic calculator, long-term memory store) in an interactive ReAct loop running directly in your browser.

Live Demo: https://bravo-ai-app.web.app

---

## Key Highlights

- **Direct In-Prompt Model Selector**: Switch models seamlessly right from the prompt composer next to the Send button.
- **Autonomous ReAct Agent Loop**: Powered by `@langchain/langgraph` with real-time streaming tokens and tool execution steps.
- **Multi-Provider Support**:
  - **Google Gemini**: Gemini 3.5 Flash, 3.5 Flash-Lite, 3.6 Flash, 2.5 Flash, 2.5 Pro, and experimental preview models.
  - **Groq Cloud**: Llama 3.3 70B Versatile, Llama 3.1 8B Instant, GPT-OSS 120B, and lightweight open models.
- **Autonomous Tools**:
  - Live Web Search: Real-time web search and citation synthesis via Tavily.
  - Accurate Calculator: Deterministic mathematical arithmetic (no hallucinated math).
  - Persistent Long-Term Memory: Stores facts and preferences across conversations using a local store.
  - System & Time Context: Contextual local date and time.
- **100% Client-Side & Private**: API keys, chat histories, and long-term memories stay entirely within your local browser storage (localStorage). No middleman server.
- **First-Time Interactive Onboarding Walkthrough**: Introduces new users to features, architecture, privacy model, and guides them to configure their API key.
- **Minimalist, Distraction-Free UI**:
  - Clean desktop layout without top navbars.
  - Smooth mobile hamburger drawer navigation.
  - Light, Dark, and System (auto) theme options.

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher; v20+ recommended)
- An API key for your preferred provider:
  - Free Google Gemini API Key: https://aistudio.google.com/apikey (Recommended)
  - Free Groq API Key: https://console.groq.com/keys
  - Optional Tavily API Key: https://app.tavily.com/home (for live web search)

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

Open your browser at `http://localhost:5173`. When launching for the first time, Bravo greets you with an onboarding tour.

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

## Settings Reference

Every setting is persisted in your browser`s localStorage — nothing is sent to any server. Open **Settings** from the sidebar to configure Bravo.

### Agent Instruction

| Setting | Description |
|---|---|
| **System prompt** | The instruction Bravo follows on every message. Fully editable — customize tone, persona, or task focus. |
| **See full system prompt** | Button to preview the complete runtime prompt (instruction + memories + date/time). |
| **History depth** | Slider (4-50). Controls how many past messages the model sees each turn. Higher = more context, more tokens. |

### Model

| Setting | Description |
|---|---|
| **Provider** | Switch between Google Gemini and Groq Cloud with a single click. |
| **Model** | Drop-down to select the exact model ID within the chosen provider. |
| **Temperature** | Slider (0-1.5). Higher = more creative; lower = more focused and deterministic. |
| **Max tokens** | Number input (256-8192). Sets the upper bound on the length of each reply. |

### API Keys

| Setting | Description |
|---|---|
| **Gemini API key** | Paste your AIza key. Click Test to validate live against the Google endpoint. |
| **Groq API key** | Paste your gsk_ key. Click Test to validate live against the Groq endpoint. |
| **Tavily API key** | Paste your tvly- key. Required for the web_search tool. Click Test to validate. |

All keys are stored only in localStorage and sent directly to each provider — Bravo never proxies your keys.

### Memory

| Setting | Description |
|---|---|
| **Short-term memory** | Toggle. Persists the current conversation thread across page reloads using a LangGraph checkpointer. |
| **Long-term memory** | Toggle. Stores facts across separate chats in a LangGraph Store backed by localStorage. |
| **Auto memory tool** | Toggle. Allows the agent to autonomously save facts using the memory_save tool when it detects something worth remembering. |
| **Manual memory add** | Text input to manually inject a fact. Press Enter or click Add. |
| **Memory list** | View all stored memories. Delete individual entries with the trash icon. |
| **Clear all memories** | Danger button to wipe all long-term memories at once. |

### Guardrails

| Setting | Description |
|---|---|
| **Enable guardrails** | Master toggle for all safety rails. When off, no input/output checks are applied. |
| **Max output characters** | Number input (1000-50000). Replies longer than this limit are automatically truncated by the output rail. |
| **Blocked rules** | Add custom words or regex patterns. Any user message matching a rule is rejected before reaching the model. Built-in safety rules always apply in addition to your custom list. |

### Tools

| Tool | Description |
|---|---|
| **Web search** | Toggle. Enables live web search via Tavily. Requires a Tavily API key. |
| **Calculator** | Toggle. Enables deterministic arithmetic evaluation. |
| **Current time** | Toggle. Lets the agent fetch the user local date and time. |
| **Memory save** | Toggle. Lets the agent autonomously write facts to long-term memory. |

### LangSmith Tracing

| Setting | Description |
|---|---|
| **Enable tracing** | Toggle. Sends full run traces (agent steps, model calls, tool calls) to LangSmith for observability. |
| **API key** | Your LangSmith lsv2_pt_ key. Click Test to validate. |
| **Project** | The LangSmith project name traces are grouped under (default: Bravo). |
| **Endpoint** | LangSmith API endpoint URL (default: https://api.smith.langchain.com). Change for self-hosted instances. |

### Appearance

| Setting | Description |
|---|---|
| **Theme** | Choose Light, Dark, or System (Default). System follows your OS preference automatically. |
| **Send on Enter** | Toggle. When on, pressing Enter sends the message. When off, Enter adds a newline. |

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
    │   ├── SettingsView.jsx     # All settings sections and controls
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

This project is licensed under the MIT License — see the LICENSE file for details.
