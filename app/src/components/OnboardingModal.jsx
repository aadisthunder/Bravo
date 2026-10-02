import { useState, useEffect } from "react";
import {
  Sparkles,
  Search,
  Calculator,
  Brain,
  Shield,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Cpu,
} from "lucide-react";
import { APP_NAME } from "../lib/constants.js";
import { setOnboardingCompleted } from "../lib/onboarding.js";
import "./OnboardingModal.css";

export default function OnboardingModal({ isOpen, onClose, onOpenSettings }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFinish = (openSettings = false) => {
    setOnboardingCompleted();
    onClose();
    if (openSettings && onOpenSettings) {
      onOpenSettings();
    }
  };

  const steps = [
    {
      title: `Welcome to ${APP_NAME}`,
      badge: "What it does",
      headline: "Your autonomous, multi-agent AI research assistant",
      description: `${APP_NAME} combines cutting-edge LLMs with autonomous tools to research, compute, and synthesize answers directly in your browser.`,
      features: [
        {
          icon: Search,
          title: "Live Web Search",
          desc: "Searches the live web via Tavily to answer with up-to-date facts and citations.",
        },
        {
          icon: Calculator,
          title: "Accurate Math",
          desc: "Executes deterministic mathematical equations without hallucinating arithmetic.",
        },
        {
          icon: Brain,
          title: "Persistent Memory",
          desc: "Remembers your preferences and instructions across conversations.",
        },
      ],
    },
    {
      title: "How It Works",
      badge: "Architecture & Privacy",
      headline: "Client-side ReAct loop with complete privacy",
      description: `${APP_NAME} runs an autonomous agent loop powered by LangChain and LangGraph right inside your browser window.`,
      features: [
        {
          icon: Cpu,
          title: "ReAct Agent Loop",
          desc: "The agent reasons, picks tools, inspects outputs, and refines answers in real time.",
        },
        {
          icon: Shield,
          title: "100% Private & Local",
          desc: "Your keys, chat histories, and memories never pass through any middleman server.",
        },
        {
          icon: CheckCircle2,
          title: "Full Transparency",
          desc: "See every tool call, search query, and reasoning step as it executes live.",
        },
      ],
    },
    {
      title: "Add Your API Key",
      badge: "Get Started",
      headline: "Configure your provider in Settings to begin",
      description: `To start chatting with ${APP_NAME}, please provide a free API key from Google Gemini or Groq in Settings.`,
      isFinal: true,
      features: [
        {
          icon: KeyRound,
          title: "Google Gemini (Recommended)",
          desc: "Free API keys with high rate limits available directly from Google AI Studio.",
        },
        {
          icon: Cpu,
          title: "Groq Cloud",
          desc: "Ultra-fast inference on open models like Llama 3.3 70B.",
        },
        {
          icon: Search,
          title: "Tavily Search (Optional)",
          desc: "Enable live web search tool capabilities by adding a Tavily key.",
        },
      ],
    },
  ];

  const currentStepData = steps[step];

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="onboarding-modal">
        {/* Close / Skip button */}
        <button
          className="onboarding-close-btn"
          onClick={() => handleFinish(false)}
          aria-label="Skip onboarding"
          title="Skip"
        >
          <X size={18} />
        </button>

        {/* Header with badge and step dots */}
        <div className="onboarding-header">
          <div className="onboarding-badge-row">
            <span className="onboarding-badge">{currentStepData.badge}</span>
            <div className="onboarding-dots">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={`onboarding-dot ${i === step ? "active" : ""} ${i < step ? "completed" : ""}`}
                  onClick={() => setStep(i)}
                  role="button"
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>
          </div>
          <h2 id="onboarding-title" className="onboarding-title">
            {currentStepData.title}
          </h2>
          <p className="onboarding-headline">{currentStepData.headline}</p>
          <p className="onboarding-desc">{currentStepData.description}</p>
        </div>

        {/* Feature cards for the step */}
        <div className="onboarding-body">
          <div className="onboarding-cards">
            {currentStepData.features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="onboarding-card">
                  <div className="onboarding-card-icon">
                    <Icon size={18} />
                  </div>
                  <div className="onboarding-card-content">
                    <h4 className="onboarding-card-title">{item.title}</h4>
                    <p className="onboarding-card-desc">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="onboarding-footer">
          {step > 0 ? (
            <button className="btn onboarding-btn-back" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          ) : (
            <button className="btn onboarding-btn-skip" onClick={() => handleFinish(false)}>
              Skip
            </button>
          )}

          <div className="onboarding-footer-right">
            {currentStepData.isFinal ? (
              <>
                <button className="btn" onClick={() => handleFinish(false)}>
                  Done
                </button>
                <button
                  className="btn btn-primary onboarding-btn-primary"
                  onClick={() => handleFinish(true)}
                >
                  <KeyRound size={16} />
                  <span>Add API Key in Settings</span>
                </button>
              </>
            ) : (
              <button
                className="btn btn-primary onboarding-btn-primary"
                onClick={() => setStep((s) => s + 1)}
              >
                <span>Next</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
