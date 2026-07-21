import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./AiMentor.css";

// ─── Constants ───────────────────────────────────────────────────────────────

const SUGGESTED_QUESTIONS = [
  "Explain closures in JavaScript 🔒",
  "What is Big O notation? 📊",
  "How does React's useEffect work? ⚛️",
  "Tips for system design interviews 🏗️",
  "Difference between SQL and NoSQL 🗄️",
  "What are RESTful API best practices? 🌐",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderInline(text, keyPrefix = "inline") {
  if (!text) return null;

  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((chunk, k) => {
    const key = `${keyPrefix}-${k}`;

    if (chunk.startsWith("**") && chunk.endsWith("**")) {
      return <strong key={key}>{chunk.slice(2, -2)}</strong>;
    }

    if (chunk.startsWith("`") && chunk.endsWith("`")) {
      return <code key={key}>{chunk.slice(1, -1)}</code>;
    }

    if (chunk.startsWith("- ")) {
      return <span key={key}>• {chunk.slice(2)}</span>;
    }

    return chunk;
  });
}

function isTableRow(line) {
  const trimmed = line.trim();
  return trimmed.includes("|") && /^\|?.+\|.+$/.test(trimmed);
}

function isTableSeparator(line) {
  const trimmed = line.trim();
  return /^\|?[\s:|\-]+\|?$/.test(trimmed) && trimmed.includes("-");
}

function parseTableRow(line) {
  const trimmed = line.trim();
  const normalized = trimmed.startsWith("|") ? trimmed.slice(1) : trimmed;
  const withoutEnd = normalized.endsWith("|")
    ? normalized.slice(0, -1)
    : normalized;

  return withoutEnd.split("|").map((cell) => cell.trim());
}

function renderTableBlock(lines, key) {
  const rows = lines
    .filter((line) => !isTableSeparator(line))
    .map(parseTableRow)
    .filter((row) => row.some((cell) => cell.length > 0));

  if (rows.length === 0) return null;

  const [header, ...body] = rows;

  return (
    <div key={key} className="md-table-wrap">
      <table className="md-table">
        <thead>
          <tr>
            {header.map((cell, i) => (
              <th key={i}>{renderInline(cell, `${key}-h-${i}`)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>
                  {renderInline(cell, `${key}-r${rowIndex}-c${cellIndex}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderTextBlock(lines, key) {
  return lines.map((line, j) => (
    <p key={`${key}-${j}`} className="md-paragraph">
      {renderInline(line, `${key}-line-${j}`)}
    </p>
  ));
}

function splitIntoBlocks(text) {
  const lines = text.split("\n");
  const blocks = [];
  let current = { type: "text", lines: [] };

  const flush = () => {
    if (current.lines.length > 0) {
      blocks.push(current);
    }
    current = { type: "text", lines: [] };
  };

  for (const line of lines) {
    if (isTableRow(line)) {
      if (current.type !== "table") {
        flush();
        current = { type: "table", lines: [] };
      }
      current.lines.push(line);
      continue;
    }

    if (current.type === "table") {
      flush();
    }

    current.lines.push(line);
  }

  flush();
  return blocks;
}

/**
 * Lightweight markdown renderer — code blocks, tables, bold, inline code, lists.
 */
function renderMarkdown(text) {
  if (!text) return null;

  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const langMatch = part.match(/^```([a-zA-Z]*)\n?/);
      const code = part
        .replace(/^```[a-zA-Z]*\n?/, "")
        .replace(/\n?```$/, "");

      return (
        <pre key={`code-${i}`}>
          {langMatch?.[1] && <span className="code-lang">{langMatch[1]}</span>}
          <code>{code}</code>
        </pre>
      );
    }

    return splitIntoBlocks(part).map((block, blockIndex) => {
      const key = `block-${i}-${blockIndex}`;

      if (block.type === "table") {
        return renderTableBlock(block.lines, key);
      }

      const nonEmptyLines = block.lines.filter((line) => line.trim().length > 0);
      if (nonEmptyLines.length === 0) return null;

      return (
        <div key={key} className="md-text-block">
          {renderTextBlock(nonEmptyLines, key)}
        </div>
      );
    });
  });
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

function AiMentor() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]); // no welcome msg in list — shown separately
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false); // true once first message sent

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  // Keep a ref to the latest messages so sendMessage always has up-to-date history
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ── Auto-resize textarea ──────────────────────────────────────────────────
  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  // ── Build Gemini-compatible history from current messages ref ─────────────
  // Uses ref (not state) to avoid stale closure when called right after setMessages
  const buildHistoryFromRef = useCallback(() => {
    return messagesRef.current
      .filter((m) => !m.isError)
      .map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      }));
  }, []);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text) => {
      const trimmed = (text ?? input).trim();
      if (!trimmed || isLoading) return;

      setHasStarted(true);

      const userMsg = {
        id: `user-${Date.now()}`,
        role: "user",
        text: trimmed,
        timestamp: new Date(),
      };

      // Immediately add user message
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      // Build history from the ref BEFORE this message (backend adds current msg itself)
      const history = buildHistoryFromRef();

      try {
        const res = await API.post("/ai-mentor/chat", {
          message: trimmed,
          history, // previous turns only — controller appends trimmed as the new message
        });

        const aiMsg = {
          id: `ai-${Date.now()}`,
          role: "model",
          text: res.data.reply,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        const errorText =
          err?.response?.data?.error ||
          "Something went wrong. Please check your connection and try again.";

        const errMsg = {
          id: `err-${Date.now()}`,
          role: "model",
          text: `⚠️ ${errorText}`,
          timestamp: new Date(),
          isError: true,
        };

        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsLoading(false);
        setTimeout(() => textareaRef.current?.focus(), 80);
      }
    },
    [input, isLoading, buildHistoryFromRef]
  );

  // ── Keyboard handler ──────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Clear conversation ────────────────────────────────────────────────────
  const handleClear = () => {
    setMessages([]);
    setHasStarted(false);
    setInput("");
    textareaRef.current?.focus();
  };

  const userInitial =
    (localStorage.getItem("userName") || "U").charAt(0).toUpperCase();

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="ai-mentor-container">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="ai-mentor-header">
        <button
          id="ai-mentor-back"
          className="ai-mentor-back-btn"
          onClick={() => navigate("/dashboard")}
          aria-label="Back to Dashboard"
        >
          ←
        </button>

        <div className="ai-mentor-header-avatar" aria-hidden="true">🤖</div>

        <div className="ai-mentor-header-info">
          <span className="ai-mentor-header-name">SkillBot — AI Mentor</span>
          <span className="ai-mentor-header-status">
            <span className="ai-mentor-status-dot" />
            Online · Programming &amp; Career Expert
          </span>
        </div>

        {hasStarted && (
          <button
            id="ai-mentor-clear"
            className="ai-mentor-clear-btn"
            onClick={handleClear}
            title="Clear conversation"
          >
            Clear Chat
          </button>
        )}
      </div>

      {/* ── Messages / Welcome ───────────────────────────────────────────── */}
      <div className="ai-mentor-messages" role="log" aria-live="polite">

        {/* Welcome screen — shown only before first message */}
        {!hasStarted && (
          <div className="ai-mentor-welcome">
            <div className="ai-mentor-welcome-icon">🤖</div>

            <div className="ai-mentor-welcome-text">
              <h2>Hey there! I'm SkillBot 👋</h2>
              <p>
                Your personal AI programming mentor on SkillSwap. Ask me about
                coding, DSA, system design, interview prep, or career growth.
              </p>
            </div>

            <div className="ai-mentor-suggestions">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  className="ai-mentor-chip"
                  onClick={() => sendMessage(q)}
                  disabled={isLoading}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation messages */}
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`ai-mentor-row ${isUser ? "user-row" : "ai-row"}`}
            >
              <div
                className={`ai-mentor-avatar ${isUser ? "user-avatar" : "ai-avatar"}`}
                aria-hidden="true"
              >
                {isUser ? userInitial : "🤖"}
              </div>

              <div className="ai-mentor-bubble-wrap">
                <span className="ai-mentor-sender">
                  {isUser ? "You" : "SkillBot"}
                </span>

                <div
                  className={`ai-mentor-bubble${msg.isError ? " error-bubble" : ""}`}
                >
                  <div className="bubble-content">
                    {renderMarkdown(msg.text)}
                  </div>
                  <time>{formatTime(msg.timestamp)}</time>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isLoading && (
          <div className="ai-mentor-row ai-row" aria-label="SkillBot is thinking">
            <div className="ai-mentor-avatar ai-avatar" aria-hidden="true">🤖</div>
            <div className="ai-mentor-bubble-wrap">
              <span className="ai-mentor-sender">SkillBot</span>
              <div className="ai-mentor-typing" role="status">
                <span className="ai-mentor-dot" />
                <span className="ai-mentor-dot" />
                <span className="ai-mentor-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input Bar ────────────────────────────────────────────────────── */}
      <div className="ai-mentor-input-bar">
        <div className="ai-mentor-input-wrap">
          <textarea
            id="ai-mentor-input"
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about coding, DSA, system design…"
            rows={1}
            disabled={isLoading}
            aria-label="Message input"
          />
          <button
            id="ai-mentor-send"
            className="ai-mentor-send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
          >
            ➤
          </button>
        </div>
        <p className="ai-mentor-input-hint">
          <kbd>Enter</kbd> to send &nbsp;·&nbsp; <kbd>Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}

export default AiMentor;
