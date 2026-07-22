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

const LOCAL_STORAGE_KEY = "skillswap_ai_mentor_history";

// ─── Copy Button Component for Code Blocks ──────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button className="code-copy-btn" onClick={handleCopy} title="Copy code">
      {copied ? "✓ Copied" : "📋 Copy"}
    </button>
  );
}

// ─── Formatting Helpers ──────────────────────────────────────────────────────

function renderInline(text, keyPrefix = "inline") {
  if (!text) return null;

  // Handles bold (**text**), inline code (`code`), and list items
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((chunk, k) => {
    const key = `${keyPrefix}-${k}`;

    if (chunk.startsWith("**") && chunk.endsWith("**")) {
      return <strong key={key}>{chunk.slice(2, -2)}</strong>;
    }

    if (chunk.startsWith("`") && chunk.endsWith("`")) {
      return <code key={key}>{chunk.slice(1, -1)}</code>;
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
  const withoutEnd = normalized.endsWith("|") ? normalized.slice(0, -1) : normalized;
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

/**
 * Enhanced Markdown & Q&A Text Formatter with Cursor Support
 */
function renderMarkdown(text, isStreaming) {
  if (!text && !isStreaming) return null;

  const content = text || "";
  const parts = content.split(/(```[\s\S]*?```)/g);

  const renderedParts = parts.map((part, i) => {
    if (part.startsWith("```")) {
      const langMatch = part.match(/^```([a-zA-Z]*)\n?/);
      const code = part.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "");
      const lang = langMatch?.[1] || "code";

      return (
        <div key={`code-block-${i}`} className="md-code-container">
          <div className="md-code-header">
            <span className="code-lang-tag">⚡ {lang}</span>
            <CopyButton text={code} />
          </div>
          <pre className="md-code-body">
            <code>{code}</code>
          </pre>
        </div>
      );
    }

    const lines = part.split("\n");
    const elements = [];
    let currentTable = [];

    const flushTable = (k) => {
      if (currentTable.length > 0) {
        elements.push(renderTableBlock(currentTable, `tbl-${k}`));
        currentTable = [];
      }
    };

    lines.forEach((line, j) => {
      const key = `line-${i}-${j}`;
      const trimmed = line.trim();

      if (isTableRow(line)) {
        currentTable.push(line);
        return;
      }

      flushTable(j);

      if (!trimmed) return;

      // Headings
      if (trimmed.startsWith("### ")) {
        elements.push(<h4 key={key} className="md-h3">{renderInline(trimmed.slice(4), key)}</h4>);
      } else if (trimmed.startsWith("## ")) {
        elements.push(<h3 key={key} className="md-h2">{renderInline(trimmed.slice(3), key)}</h3>);
      } else if (trimmed.startsWith("# ")) {
        elements.push(<h2 key={key} className="md-h1">{renderInline(trimmed.slice(2), key)}</h2>);
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        elements.push(
          <div key={key} className="md-bullet-item">
            <span className="bullet-dot">•</span>
            <span>{renderInline(trimmed.slice(2), key)}</span>
          </div>
        );
      } else if (/^\d+\.\s/.test(trimmed)) {
        const num = trimmed.match(/^(\d+)\.\s/)[1];
        const contentStr = trimmed.replace(/^\d+\.\s/, "");
        elements.push(
          <div key={key} className="md-numbered-item">
            <span className="num-tag">{num}.</span>
            <span>{renderInline(contentStr, key)}</span>
          </div>
        );
      } else {
        elements.push(
          <p key={key} className="md-paragraph">
            {renderInline(line, key)}
          </p>
        );
      }
    });

    flushTable("end");
    return <div key={`part-${i}`} className="md-text-wrapper">{elements}</div>;
  });

  return (
    <>
      {renderedParts}
      {isStreaming && <span className="streaming-cursor" aria-hidden="true" />}
    </>
  );
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Main Component ──────────────────────────────────────────────────────────

function AiMentor() {
  const navigate = useNavigate();

  // Local Storage Session Management
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesRef = useRef(messages);
  const messagesContainerRef = useRef(null);
  const streamingIntervalRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const lastScrollTopRef = useRef(0);

  const [showScrollButton, setShowScrollButton] = useState(false);

  const SCROLL_THRESHOLD = 100;

  const isNearBottom = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return true;
    const { scrollTop, scrollHeight, clientHeight } = el;
    return scrollHeight - scrollTop - clientHeight <= SCROLL_THRESHOLD;
  }, []);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleMessagesScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom <= SCROLL_THRESHOLD;

    if (scrollTop < lastScrollTopRef.current - 2) {
      shouldAutoScrollRef.current = false;
    } else if (nearBottom) {
      shouldAutoScrollRef.current = true;
    }

    lastScrollTopRef.current = scrollTop;
    setShowScrollButton(
      !nearBottom && hasStarted && messagesRef.current.length > 0
    );
  }, [hasStarted]);

  const handleScrollToLatest = useCallback(() => {
    shouldAutoScrollRef.current = true;
    setShowScrollButton(false);
    scrollToBottom("smooth");
  }, [scrollToBottom]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Persist sessions array to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
    } catch (err) {
      console.error("Failed to save history to localStorage", err);
    }
  }, [sessions]);

  // Smart auto-scroll: only follow new content when user is near the bottom
  useEffect(() => {
    if (!shouldAutoScrollRef.current) {
      setShowScrollButton(hasStarted && messages.length > 0 && !isNearBottom());
      return;
    }

    const isStreaming = messages.some((m) => m.isStreaming);
    scrollToBottom(isStreaming || isLoading ? "auto" : "smooth");
    setShowScrollButton(false);
  }, [messages, isLoading, hasStarted, scrollToBottom, isNearBottom]);

  // Auto-resize textarea
  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  // Clear streaming timer if unmounted
  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, []);

  // ── Start New Conversation ──────────────────────────────────────────────
  const handleNewChat = () => {
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
    }
    shouldAutoScrollRef.current = true;
    setShowScrollButton(false);
    setCurrentSessionId(null);
    setMessages([]);
    setHasStarted(false);
    setInput("");
    setTimeout(() => textareaRef.current?.focus(), 80);
  };

  // ── Select Past Conversation ─────────────────────────────────────────────
  const handleSelectSession = (session) => {
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
    }
    shouldAutoScrollRef.current = true;
    setShowScrollButton(false);
    setCurrentSessionId(session.id);
    setMessages(session.messages || []);
    setHasStarted(true);
  };

  // ── Delete Past Session ──────────────────────────────────────────────────
  const handleDeleteSession = (e, sessionId) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      handleNewChat();
    }
  };

  // ── Build Gemini-compatible API history ──────────────────────────────────
  const buildHistoryFromRef = useCallback(() => {
    return messagesRef.current
      .filter((m) => !m.isError)
      .map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      }));
  }, []);

  // ── Real-time Streaming Helper ──────────────────────────────────────────
  const startRealtimeStream = useCallback(
    (fullReplyText, aiMsgId, activeId, initialUserMsg, prevMessages) => {
      // Split into small character chunks (3-5 chars per tick) for silky smooth typing
      const chunks = fullReplyText.match(/[\s\S]{1,4}/g) || [fullReplyText];
      let chunkIdx = 0;
      let streamedContent = "";

      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }

      streamingIntervalRef.current = setInterval(() => {
        if (chunkIdx < chunks.length) {
          streamedContent += chunks[chunkIdx];
          chunkIdx++;

          setMessages((prev) =>
            prev.map((m) => (m.id === aiMsgId ? { ...m, text: streamedContent } : m))
          );
        } else {
          // Streaming finalized
          clearInterval(streamingIntervalRef.current);
          streamingIntervalRef.current = null;

          const finalizedAiMsg = {
            id: aiMsgId,
            role: "model",
            text: fullReplyText,
            timestamp: new Date().toISOString(),
            isStreaming: false,
          };

          const finalMessages = [...prevMessages, initialUserMsg, finalizedAiMsg];

          setMessages(finalMessages);

          // Update localStorage session
          setSessions((prev) => {
            const exists = prev.some((s) => s.id === activeId);
            const firstUserMsg = finalMessages.find((m) => m.role === "user");
            const sessionTitle = firstUserMsg
              ? firstUserMsg.text.slice(0, 32) + "..."
              : "New Chat";

            if (exists) {
              return prev.map((s) =>
                s.id === activeId
                  ? { ...s, messages: finalMessages, updatedAt: new Date().toISOString() }
                  : s
              );
            } else {
              return [
                {
                  id: activeId,
                  title: sessionTitle,
                  messages: finalMessages,
                  updatedAt: new Date().toISOString(),
                },
                ...prev,
              ];
            }
          });

          setTimeout(() => textareaRef.current?.focus(), 80);
        }
      }, 14); // 14ms per chunk gives a ChatGPT-like ~250 wpm stream rate
    },
    []
  );

  // ── Send Message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (textToSend) => {
      const trimmed = (textToSend ?? input).trim();
      if (!trimmed || isLoading) return;

      setHasStarted(true);

      shouldAutoScrollRef.current = true;
      setShowScrollButton(false);

      const userMsg = {
        id: `user-${Date.now()}`,
        role: "user",
        text: trimmed,
        timestamp: new Date().toISOString(),
      };

      const prevMessages = messagesRef.current;
      const updatedMessages = [...prevMessages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      let activeId = currentSessionId;
      if (!activeId) {
        activeId = `session-${Date.now()}`;
        setCurrentSessionId(activeId);
      }

      const history = buildHistoryFromRef();

      try {
        const res = await API.post("/ai-mentor/chat", {
          message: trimmed,
          history,
        });

        // Hide main loading indicator & add streaming AI message entry
        setIsLoading(false);

        const aiMsgId = `ai-${Date.now()}`;
        const initialAiMsg = {
          id: aiMsgId,
          role: "model",
          text: "",
          timestamp: new Date().toISOString(),
          isStreaming: true,
        };

        setMessages([...updatedMessages, initialAiMsg]);

        // Start word-by-word real-time stream animation
        startRealtimeStream(
          res.data.reply,
          aiMsgId,
          activeId,
          userMsg,
          prevMessages
        );
      } catch (err) {
        setIsLoading(false);

        const errorText =
          err?.response?.data?.error ||
          "Something went wrong. Please check your connection and try again.";

        const errMsg = {
          id: `err-${Date.now()}`,
          role: "model",
          text: `⚠️ ${errorText}`,
          timestamp: new Date().toISOString(),
          isError: true,
        };

        setMessages((prev) => [...prev, errMsg]);
      }
    },
    [input, isLoading, currentSessionId, buildHistoryFromRef, startRealtimeStream]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const userInitial =
    (localStorage.getItem("userName") || "U").charAt(0).toUpperCase();

  return (
    <div className={`ai-mentor-page ${historyOpen ? "sidebar-open" : "sidebar-closed"}`}>
      
      {/* ── 1. CONVERSATION HISTORY SIDEBAR ────────────────────────────────── */}
      <aside className="ai-history-sidebar">
        <div className="history-sidebar-header">
          <button className="new-chat-btn" onClick={handleNewChat}>
            <span className="btn-icon">+</span> New Conversation
          </button>
        </div>

        <div className="history-list-title">Conversation History 💬</div>

        <div className="history-list">
          {sessions.length === 0 ? (
            <div className="history-empty">No saved conversations</div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className={`history-item ${s.id === currentSessionId ? "active" : ""}`}
                onClick={() => handleSelectSession(s)}
              >
                <span className="history-icon">💬</span>
                <span className="history-title">{s.title}</span>
                <button
                  className="history-del-btn"
                  onClick={(e) => handleDeleteSession(e, s.id)}
                  title="Delete conversation"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── 2. MAIN WORKSPACE ──────────────────────────────────────────────── */}
      <div className="ai-mentor-workspace">
        
        {/* Header */}
        <header className="ai-mentor-header">
          <div className="header-left-group">
            <button
              className="toggle-sidebar-btn"
              onClick={() => setHistoryOpen((prev) => !prev)}
              title={historyOpen ? "Hide History" : "Show History"}
            >
              ☰
            </button>

            <button
              className="ai-mentor-back-btn"
              onClick={() => navigate("/dashboard")}
              title="Back to Dashboard"
            >
              ←
            </button>

            <div className="ai-mentor-header-avatar">🤖</div>

            <div className="ai-mentor-header-info">
              <span className="ai-mentor-header-name">SkillBot — AI Mentor</span>
              <span className="ai-mentor-header-status">
                <span className="ai-mentor-status-dot" />
                Online · Programming &amp; Career Expert
              </span>
            </div>
          </div>

          <div className="header-right-group">
            <button className="new-chat-top-btn" onClick={handleNewChat}>
              + New Chat
            </button>
          </div>
        </header>

        {/* Messages Stream */}
        <div className="ai-mentor-messages-wrap">
          <div
            className="ai-mentor-messages"
            ref={messagesContainerRef}
            onScroll={handleMessagesScroll}
          >
            {!hasStarted && (
            <div className="ai-mentor-welcome">
              <div className="ai-mentor-welcome-icon">🤖</div>
              <div className="ai-mentor-welcome-text">
                <h2>Hey there! I'm SkillBot 👋</h2>
                <p>
                  Your personal AI programming mentor. Ask me technical questions, code debugging, system design, or interview prep.
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

          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`ai-mentor-row ${isUser ? "user-row" : "ai-row"}`}
              >
                <div
                  className={`ai-mentor-avatar ${isUser ? "user-avatar" : "ai-avatar"}`}
                >
                  {isUser ? userInitial : "🤖"}
                </div>

                <div className="ai-mentor-bubble-wrap">
                  <div className="ai-mentor-sender-badge">
                    <span className="sender-name">{isUser ? "Question / You" : "Answer / SkillBot AI"}</span>
                  </div>

                  <div className={`ai-mentor-bubble ${msg.isError ? "error-bubble" : ""}`}>
                    <div className="bubble-content">
                      {renderMarkdown(msg.text, msg.isStreaming)}
                    </div>
                    <time>{formatTime(msg.timestamp)}</time>
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="ai-mentor-row ai-row">
              <div className="ai-mentor-avatar ai-avatar">🤖</div>
              <div className="ai-mentor-bubble-wrap">
                <div className="ai-mentor-sender-badge">
                  <span className="sender-name">SkillBot AI</span>
                </div>
                <div className="ai-mentor-typing">
                  <span className="ai-mentor-dot" />
                  <span className="ai-mentor-dot" />
                  <span className="ai-mentor-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
          </div>

          {showScrollButton && (
            <button
              type="button"
              className="scroll-to-latest-btn"
              onClick={handleScrollToLatest}
              aria-label="Scroll to latest message"
            >
              ↓ Scroll to Latest
            </button>
          )}
        </div>

        {/* Input Bar */}
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
              placeholder="Ask SkillBot a question (e.g. Explain React hooks, optimize SQL query)..."
              rows={1}
              disabled={isLoading}
            />
            <button
              id="ai-mentor-send"
              className="ai-mentor-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              title="Send message"
            >
              ➤
            </button>
          </div>
          <p className="ai-mentor-input-hint">
            <kbd>Enter</kbd> to send &nbsp;·&nbsp; <kbd>Shift+Enter</kbd> for line break
          </p>
        </div>

      </div>
    </div>
  );
}

export default AiMentor;
