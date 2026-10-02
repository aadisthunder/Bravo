<div align="center">

<img src="https://raw.githubusercontent.com/aadisthunder/Gyani-AI/main/app/public/logo.svg" alt="Bravo Logo" width="100" height="100" />

<h1>Bravo</h1>

<p><strong>A privacy-first, fully client-side AI assistant powered by LangChain & LangGraph.</strong><br/>
Autonomous tool use · Long-term memory · Guardrails · LangSmith tracing — zero server, zero data leaks.</p>

[![Live Demo](https://img.shields.io/badge/Live%20Demo-bravo--ai--app.web.app-8b5cf6?style=for-the-badge&logo=firebase&logoColor=white)](https://bravo-ai-app.web.app)
&nbsp;
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)
&nbsp;
[![Tests](https://img.shields.io/badge/Tests-10%20passing-22c55e?style=for-the-badge&logo=vitest&logoColor=white)](#running-tests--building)

---

### Tech Stack

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-1e1e2e?style=for-the-badge&logo=vite&logoColor=646CFF)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-0f172a?style=for-the-badge&logo=langchain&logoColor=4ade80)
![LangSmith](https://img.shields.io/badge/LangSmith-FF6B35?style=for-the-badge&logo=langchain&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logo=groq&logoColor=white)
![Tavily](https://img.shields.io/badge/Tavily-0ea5e9?style=for-the-badge&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase%20Hosting-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

</div>

---

## What is Bravo?

Bravo runs **entirely in your browser**. There is no backend, no proxy, and no telemetry. Your API keys, conversations, and long-term memories are stored exclusively in your own `localStorage` and sent directly to each AI provider.

It is built on the **LangGraph ReAct loop** — the agent autonomously decides which tools to call, streams tokens live as it thinks, and surfaces every tool step in the chat UI.

---

## Features

<table>
<tr>
<td width="50%">

### 🤖 Multi-Provider Models
Switch between **Google Gemini** and **Groq Cloud** from the prompt bar or Settings.

- Gemini 3.5 Flash / 3.5 Flash-Lite
- Gemini 3.6 Flash / 2.5 Flash / 2.5 Pro
- Gemini 3 Flash & 3.1 Pro (Preview)
- Llama 3.3 70B / 3.1 8B (via Groq)
- GPT-OSS 120B / 20B (via Groq)

</td>
<td width="50%">

### 🔧 Autonomous Tools
The agent picks the right tool automatically.

| Tool | What it does |
|---|---|
| 🔍 Web Search | Live results via Tavily |
| 🧮 Calculator | Deterministic arithmetic |
| 🕒 Current Time | Local date & time |
| 🧠 Memory Save | Persist facts long-term |

</td>
</tr>
<tr>
<td width="50%">

### 🧠 Layered Memory
- **Short-term**: LangGraph checkpointer persists conversation across reloads
- **Long-term**: Cross-chat fact store in `localStorage`
- **Manual**: Add, view, and delete memories in Settings
- **Auto**: Agent saves facts autonomously via `memory_save` tool

</td>
<td width="50%">

### 🛡️ Guardrails
Deterministic safety checks with zero latency.

- Master on/off toggle
- Max output character limit
- Custom blocked words & `/regex/` patterns
- Built-in harmful content blocklist
- Input length cap (20,000 characters)

</td>
</tr>
<tr>
<td width="50%">

### 📊 LangSmith Tracing
Full observability into every agent run.

- Per-session tracers with project grouping
- Configurable API key, project name, endpoint
- Compatible with self-hosted LangSmith

</td>
<td width="50%">

### 🎨 Premium UI
- In-prompt model selector (next to Send)
- First-time onboarding walkthrough
- Mobile hamburger drawer navigation
- Light / Dark / System themes
- Send on Enter toggle

</td>
</tr>
</table>

---

## Getting Started

### Prerequisites

- **Node.js** v18+ ([download](https://nodejs.org))
- At least one API key:

| Provider | Get Key | Cost |
|---|---|---|
| Google Gemini | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | Free tier |
| Groq Cloud | [console.groq.com/keys](https://console.groq.com/keys) | Free tier |
| Tavily Search | [app.tavily.com](https://app.tavily.com/home) | Free tier |
| LangSmith | [smith.langchain.com](https://smith.langchain.com/settings) | Free tier |

### Installation

```bash
# Clone the repository
git clone https://github.com/aadisthunder/Gyani-AI.git
cd Gyani-AI/app

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [`http://localhost:5173`](http://localhost:5173) — the onboarding walkthrough will guide you through setup.

---

## Running Tests & Building

```bash
# Run all unit tests (10 tests across 2 suites)
npm test

# Build production bundle
npm run build

# Preview the production build locally
npm run preview
```

> **Note**: The production bundle is ~2MB uncompressed (637KB gzipped) due to bundled LangChain/Zod dependencies. This is expected for a fully client-side agent framework.

---

## Settings Reference

Every setting lives in `localStorage`. Open **Settings** from the sidebar to configure.

### 🤖 Agent Instruction

| Setting | Description |
|---|---|
| **System prompt** | Editable instruction Bravo follows on every message. Customize persona, tone, or task focus. |
| **See full system prompt** | Preview the complete runtime prompt (instruction + recalled memories + current date/time). |
| **History depth** | `4–50` — How many past messages the model sees per turn. More = richer context, more tokens used. |

### ⚙️ Model

| Setting | Description |
|---|---|
| **Provider** | Toggle between Google Gemini and Groq Cloud. |
| **Model** | Select exact model ID from the provider's catalogue. |
| **Temperature** | `0–1.5` — Higher = more creative; lower = more deterministic. |
| **Max tokens** | `256–8192` — Upper bound on reply length per turn. |

### 🔑 API Keys

| Setting | Description |
|---|---|
| **Gemini API key** | `AIza…` — Live **Test** button validates against Google endpoint. |
| **Groq API key** | `gsk_…` — Live **Test** button validates against Groq endpoint. |
| **Tavily API key** | `tvly-…` — Required for `web_search` tool. Live **Test** included. |

> Keys are stored only in `localStorage` and sent directly to providers — Bravo is never in the middle.

### 🧠 Memory

| Setting | Description |
|---|---|
| **Short-term memory** | LangGraph checkpointer — conversation survives page refreshes. |
| **Long-term memory** | Cross-chat LangGraph Store backed by `localStorage`. |
| **Auto memory tool** | Let the agent autonomously save notable facts via `memory_save`. |
| **Manual memory** | Add a fact by typing and pressing Enter. Delete or clear all from the list. |

### 🛡️ Guardrails

| Setting | Description |
|---|---|
| **Enable guardrails** | Master toggle — disables all rails when off. |
| **Max output characters** | `1000–50000` — Output rail truncates replies exceeding this. |
| **Blocked rules** | Custom words or `/regex/` patterns. Any match rejects the message before it hits the model. |

### 🔧 Tools

| Tool | Toggle | Requirement |
|---|---|---|
| Web search | ✅ | Tavily API key |
| Calculator | ✅ | None |
| Current time | ✅ | None |
| Memory save | ✅ | Long-term memory enabled |

### 📊 LangSmith Tracing

| Setting | Description |
|---|---|
| **Enable tracing** | Sends full run traces to LangSmith. |
| **API key** | `lsv2_pt_…` — with live **Test** validation. |
| **Project** | Group traces under a project name (default: `Bravo`). |
| **Endpoint** | API URL — change for self-hosted deployments. |

### 🎨 Appearance

| Setting | Description |
|---|---|
| **Theme** | **Light** / **Dark** / **System** — System follows OS preference automatically. |
| **Send on Enter** | On: Enter sends. Off: Enter adds a newline, button/Shift+Enter sends. |

---

## Project Structure

```
Gyani-AI/
├── .firebaserc                  # Firebase project alias
├── firebase.json                # Firebase Hosting config (SPA rewrites + cache headers)
├── README.md
└── app/
    ├── index.html               # HTML entry + meta tags
    ├── package.json
    ├── vite.config.js
    ├── tests/
    │   ├── onboarding_and_models.test.js
    │   └── settings_theme.test.js
    └── src/
        ├── App.jsx              # Root state, view router, settings persistence
        ├── index.css            # Design tokens, dark/light themes
        ├── components/
        │   ├── ChatView.jsx     # Chat UI, prompt bar, inline model selector
        │   ├── OnboardingModal.jsx  # Multi-step first-run walkthrough
        │   ├── Sidebar.jsx      # Chat history, mobile drawer
        │   ├── SettingsView.jsx # All 8 settings sections
        │   └── Message.jsx      # Markdown + tool step renderer
        └── lib/
            ├── agent.js         # LangGraph ReAct loop, streaming, tracer
            ├── constants.js     # Providers, models, default settings
            ├── models.js        # Model factory + live key validation
            ├── persistence.js   # LocalStorageSaver & LocalStorageStore
            ├── guardrails.js    # Input/output safety rails
            ├── tools.js         # Tool definitions (Tavily, calculator, time, memory)
            ├── onboarding.js    # Onboarding state helpers
            ├── settings.js      # localStorage persistence + deepMerge migration
            └── theme.js         # Theme application + system listener
```

---

## Deployment

The app is deployed on **Firebase Hosting** and served as a static SPA.

```bash
# Build
cd app && npm run build

# Deploy
cd .. && firebase deploy --only hosting
```

Live at: **[https://bravo-ai-app.web.app](https://bravo-ai-app.web.app)**

---

## Author

<div align="center">

Made with ❤️ by **Aaditya Parkash**

[![GitHub](https://img.shields.io/badge/GitHub-aadisthunder-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/aadisthunder)

</div>

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
