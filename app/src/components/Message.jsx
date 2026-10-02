import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Bot,
  UserRound,
  Copy,
  Check,
  ChevronRight,
  Globe,
  Calculator,
  Clock,
  Brain,
  Wrench,
  CircleAlert,
  ShieldAlert,
  KeyRound,
  CircleCheck,
} from "lucide-react";
import "./Message.css";

const TOOL_ICONS = {
  web_search: Globe,
  calculator: Calculator,
  current_time: Clock,
  memory_save: Brain,
};

const ERROR_ICONS = {
  guardrail: ShieldAlert,
  config: KeyRound,
  api: CircleAlert,
  unknown: CircleAlert,
};

function friendlyToolSummary(tool) {
  if (!tool.result) return tool.running ? "running…" : "";
  try {
    const parsed = JSON.parse(tool.result);
    if (tool.name === "web_search" && Array.isArray(parsed.results)) {
      const hosts = [...new Set(parsed.results.map((r) => { try { return new URL(r.url).hostname.replace("www.", ""); } catch { return r.url; } }))].slice(0, 3);
      return `${parsed.results.length} results · ${hosts.join(", ")}`;
    }
    return `done`;
  } catch {
    const s = String(tool.result).replace(/\s+/g, " ");
    return s.length > 120 ? s.slice(0, 120) + "…" : s;
  }
}

function ToolCard({ tool }) {
  const [open, setOpen] = useState(false);
  const Icon = TOOL_ICONS[tool.name] || Wrench;
  const preview = friendlyToolSummary(tool);
  return (
    <div className={`tool-card ${tool.running ? "running" : ""}`}>
      <button className="tool-card-head" onClick={() => setOpen((o) => !o)}>
        {tool.running ? <Wrench size={14} className="spin" /> : <Icon size={14} />}
        <span className="tool-card-name">{tool.name}</span>
        <span className="tool-card-preview">{tool.running ? "running…" : preview}</span>
        <ChevronRight size={13} className={`tool-card-chev ${open ? "open" : ""}`} />
      </button>
      {open && (
        <div className="tool-card-body">
          {tool.args && Object.keys(tool.args).length > 0 && (
            <div className="tool-card-section">
              <span className="tool-card-label">Input</span>
              <pre className="mono">{JSON.stringify(tool.args, null, 2)}</pre>
            </div>
          )}
          {tool.result && (
            <div className="tool-card-section">
              <span className="tool-card-label">Result</span>
              <pre className="mono">{tool.result}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="code-block">
      <div className="code-head">
        <span>{language || "code"}</span>
        <button className="code-copy" onClick={copy}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language || "text"}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: "0 0 10px 10px",
          padding: "13px 15px",
          fontSize: "12.8px",
          lineHeight: 1.6,
          background: "#161615",
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}

export default function Message({ message }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const copyMsg = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const ErrIcon = ERROR_ICONS[message.error?.kind] || CircleAlert;

  return (
    <div className={`msg ${isUser ? "user" : "ai"}`}>
      {!isUser && (
        <div className="msg-avatar">
          <Bot size={15} />
        </div>
      )}
      <div className="msg-body">
        {!isUser && message.tools?.length > 0 && (
          <div className="msg-tools">
            {message.tools.map((t, i) => (
              <ToolCard key={i} tool={t} />
            ))}
          </div>
        )}

        <div className={`msg-bubble ${isUser ? "user-bubble" : "ai-bubble"}`}>
          {message.error && (
            <div className="msg-error">
              <ErrIcon size={14} />
              <div>
                <p className="msg-error-title">{message.error.message}</p>
                {message.error.detail && <p className="msg-error-detail">{message.error.detail}</p>}
              </div>
            </div>
          )}
          {isUser ? (
            <p className="msg-user-text">{message.content}</p>
          ) : (
            message.content && (
              <ReactMarkdown
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const text = String(children).replace(/\n$/, "");
                    const isBlock = !text.includes("\n") === false || match || text.length > 60;
                    if (match) {
                      return (
                        <CodeBlock language={match[1]}>{text}</CodeBlock>
                      );
                    }
                    if (text.includes("\n")) {
                      return <CodeBlock language="">{text}</CodeBlock>;
                    }
                    return (
                      <code className="inline-code" {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            )
          )}
        </div>

        {!isUser && message.content && (
          <div className="msg-actions">
            <button className="msg-action" onClick={copyMsg} title="Copy message">
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>
      {isUser && (
        <div className="msg-avatar user">
          <UserRound size={15} />
        </div>
      )}
    </div>
  );
}
