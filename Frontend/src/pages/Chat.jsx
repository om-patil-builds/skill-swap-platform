import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Chat.css";
import DOMPurify from "dompurify";
import socket from "../socket";

function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const currentUserId = localStorage.getItem("userId");
  const currentUserName = localStorage.getItem("userName") || "Me";

  const isOnline = onlineUsers.includes(userId);

  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await API.get(`/chat/${userId}`);
      setMessages(res.data.chats || []);
    } catch (err) {
      console.error("Fetch messages error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await API.get(`/users/${userId}`);
      setUserName(res.data.username || "User");
    } catch (err) {
      console.error("Fetch user error:", err);
    }
  };

  const isMe = (sender) => {
    if (!sender) return false;
    const senderId = typeof sender === "object" ? sender._id : sender;
    return String(senderId) === String(currentUserId);
  };

  useEffect(() => {
    setLoading(true);
    fetchMessages();
    fetchUser();
    socket.emit("join", currentUserId);
  }, [userId]);

  useEffect(() => {
    const handleConnect = () => {
      socket.emit("join", currentUserId);
    };

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [currentUserId]);

  useEffect(() => {
    const handleConnect = () => {
      socket.emit("join", currentUserId);
    };

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [currentUserId]);

  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      setMessages((prev) => {
        const exists = prev.some((msg) => msg._id === data._id);
        if (exists) return prev;

        const tempIndex = prev.findIndex(
          (msg) =>
            msg._id.startsWith("temp-") &&
            String(msg.sender?._id || msg.sender) === String(data.sender?._id || data.sender) &&
            String(msg.receiver) === String(data.receiver) &&
            String(msg.message) === String(data.message)
        );

        if (tempIndex !== -1) {
          const updated = [...prev];
          updated[tempIndex] = data;
          return updated;
        }

        return [...prev, data];
      });
    });

    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    socket.on("typing", () => {
      setTyping(true);
    });

    socket.on("stopTyping", () => {
      setTyping(false);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("onlineUsers");
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, typing]);

  const sendMessage = async () => {
    if (!text.trim() || sending) return;

    const messageText = text.trim();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const tempMsg = {
      _id: tempId,
      sender: {
        _id: currentUserId,
        username: currentUserName,
      },
      receiver: userId,
      message: messageText,
      createdAt: new Date().toISOString(),
      status: "sent",
    };

    setMessages((prev) => [...prev, tempMsg]);
    setText("");
    setSending(true);

    try {
      socket.emit("sendMessage", tempMsg);
    } catch (err) {
      console.error("Send Error:", err);
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (value) => {
    setText(value);
    socket.emit("typing", {
      sender: currentUserId,
      receiver: userId,
    });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", {
        receiver: userId,
      });
    }, 800);
  };

  const deleteMessageForMe = async (id) => {
    if (id.length < 20) return;

    try {
      await API.delete(`/chat/message/${id}/me`);
      setMessages((prev) => prev.filter((msg) => msg._id !== id));
    } catch (err) {
      console.error("Delete for me error:", err);
    }
  };

  const deleteMessageForEveryone = async (id) => {
    if (id.length < 20) return;

    try {
      await API.delete(`/chat/message/${id}/everyone`);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === id
            ? {
                ...msg,
                message: "This message was deleted",
                isDeleted: true,
              }
            : msg,
        ),
      );
    } catch (err) {
      console.error("Delete for everyone error:", err);
    }
  };

  const formatTime = (time) =>
    new Date(time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            ←
          </button>

          <div className="header-info">
            <span className="header-name">{userName}</span>

            <span className="header-status">
              {typing ? "typing..." : isOnline ? "Online" : "Offline"}
            </span>
          </div>
          <button
            onClick={() =>
              navigate("/sessions", {
                state: {
                  learnerId: userId,
                  learnerName: userName,
                },
              })
            }
          >
            Schedule Session 📅
          </button>
        </div>
      </div>

      <div className="chat-messages" onClick={() => setSelectedMsg(null)}>
        {loading ? (
          <div className="loading-state">Loading...</div>
        ) : (
          messages.map((msg) => {
            const mine = isMe(msg.sender);

            return (
              <div
                key={msg._id}
                className={`msg-row ${mine ? "msg-sent" : "msg-received"}`}
              >
                <div className="msg-avatar">
                  {mine ? "M" : userName?.charAt(0)?.toUpperCase()}
                </div>

                <div className="msg-body">
                  <div className="msg-sender-name">
                    {mine ? "Me" : msg.sender?.username || userName}
                  </div>

                  <div
                    className="msg-bubble"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMsg(selectedMsg === msg._id ? null : msg._id);
                    }}
                  >
                    <div className="msg-text">
                      {msg.isDeleted ? (
                        <i>{"This message was deleted"}</i>
                      ) : (
                        <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.message || "") }} />
                      )}
                    </div>

                    <div className="msg-footer">
                      <span className="msg-time">
                        {formatTime(msg.createdAt)}
                      </span>

                      {mine && <span className="msg-tick">✓✓</span>}
                    </div>

                    {selectedMsg === msg._id && (
                      <div className="msg-delete-menu">
                        <button onClick={() => deleteMessageForMe(msg._id)}>
                          Delete for Me
                        </button>

                        {mine && (
                          <button
                            onClick={() => deleteMessageForEveryone(msg._id)}
                          >
                            Delete for Everyone
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {typing && (
          <div className="msg-row msg-received">
            <div className="msg-avatar">
              {userName?.charAt(0)?.toUpperCase()}
            </div>

            <div className="msg-body">
              <div className="msg-sender-name">{userName}</div>

              <div className="msg-bubble">
                <div className="msg-text">typing...</div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef}></div>
      </div>

      <div className="chat-input">
        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Type message..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button className="send-btn" onClick={sendMessage} disabled={sending}>
          ➤
        </button>
      </div>
    </div>
  );
}

export default Chat;
