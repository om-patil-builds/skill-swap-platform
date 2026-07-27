import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Sessions.css";

function Sessions() {
  const location = useLocation();
  const navigate = useNavigate();

  const learnerId = location.state?.learnerId;
  const learnerName = location.state?.learnerName;

  const currentUserId = localStorage.getItem("userId");

  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [meetLink, setMeetLink] = useState("");
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [editingId, setEditingId] = useState(null);
  const [editTopic, setEditTopic] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editMeetLink, setEditMeetLink] = useState("");
  const [connections, setConnections] = useState([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState("");

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  const getTodayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchSessions = async () => {
    setFetching(true);
    try {
      const res = await API.get("/sessions/my");
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.error("Fetch sessions error:", err);
      showMessage("error", "Failed to load sessions");
    } finally {
      setFetching(false);
    }
  };

  const fetchConnections = async () => {
    try {
      const res = await API.get("/requests/accepted");
      const users = res.data.users || [];
      setConnections(users);
    } catch (err) {
      console.error("Fetch connections error:", err);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchConnections();
  }, []);

  const validateDateTime = (dateVal, timeVal) => {
    if (!dateVal || !timeVal) {
      return "Date and time are required";
    }

    const today = getTodayString();
    if (dateVal < today) {
      return "Cannot schedule a session in the past";
    }

    const now = new Date();
    const [year, month, day] = dateVal.split("-").map(Number);
    const timeMatch = timeVal.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
    if (!timeMatch) {
      return "Invalid time format. Use HH:MM AM/PM";
    }

    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2];
    const period = timeMatch[3]?.toLowerCase();

    if (period === "pm" && hours < 12) hours += 12;
    if (period === "am" && hours === 12) hours = 0;

    if (hours < 0 || hours > 23 || parseInt(minutes, 10) > 59) {
      return "Invalid time value";
    }

    if (dateVal === today) {
      const sessionDate = new Date(year, month - 1, day, hours, parseInt(minutes, 10), 0);
      if (sessionDate <= now) {
        return "Cannot schedule a session in the past";
      }
    }

    return null;
  };

  const handleCreate = async () => {
    setMessage({ type: "", text: "" });

    const trimmedTopic = topic.trim();
    const trimmedDate = date.trim();
    const trimmedTime = time.trim();
    const trimmedLink = meetLink.trim();

    if (!trimmedTopic || !trimmedDate || !trimmedTime) {
      showMessage("error", "Topic, date, and time are required");
      return;
    }

    const validationError = validateDateTime(trimmedDate, trimmedTime);
    if (validationError) {
      showMessage("error", validationError);
      return;
    }

    const activeLearnerId = learnerId || selectedLearnerId;
    if (!activeLearnerId) {
      showMessage("error", "Please select a learner");
      return;
    }

    setLoading(true);

    try {
      const res = await API.post("/sessions", {
        learner: activeLearnerId,
        topic: trimmedTopic,
        date: trimmedDate,
        time: trimmedTime,
        meetLink: trimmedLink,
      });

      showMessage("success", res.data.message || "Session created successfully");
      setTopic("");
      setDate("");
      setTime("");
      setMeetLink("");
      setSelectedLearnerId("");
      fetchSessions();
    } catch (err) {
      console.error("Create session error:", err);
      const msg = err.response?.data?.message || "Failed to create session";
      showMessage("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (session) => {
    setEditingId(session._id);
    setEditTopic(session.topic || "");
    setEditDate(session.date || "");
    setEditTime(session.time || "");
    setEditMeetLink(session.meetLink || "");
    setMessage({ type: "", text: "" });
  };

  const handleUpdate = async () => {
    setMessage({ type: "", text: "" });

    const validationError = validateDateTime(editDate, editTime);
    if (validationError) {
      showMessage("error", validationError);
      return;
    }

    setLoading(true);

    try {
      const res = await API.put(`/sessions/${editingId}`, {
        topic: editTopic,
        date: editDate,
        time: editTime,
        meetLink: editMeetLink,
      });

      showMessage("success", res.data.message || "Session updated successfully");
      setEditingId(null);
      fetchSessions();
    } catch (err) {
      console.error("Update session error:", err);
      const msg = err.response?.data?.message || "Failed to update session";
      showMessage("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (sessionId) => {
    if (!window.confirm("Are you sure you want to cancel this session?")) return;

    setLoading(true);

    try {
      const res = await API.put(`/sessions/${sessionId}/status`, {
        status: "cancelled",
      });

      showMessage("success", res.data.message || "Session cancelled");
      fetchSessions();
    } catch (err) {
      console.error("Cancel session error:", err);
      const msg = err.response?.data?.message || "Failed to cancel session";
      showMessage("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (sessionId) => {
    setLoading(true);

    try {
      const res = await API.put(`/sessions/${sessionId}/status`, {
        status: "accepted",
      });

      showMessage("success", res.data.message || "Session accepted");
      fetchSessions();
    } catch (err) {
      console.error("Accept session error:", err);
      const msg = err.response?.data?.message || "Failed to accept session";
      showMessage("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (sessionId) => {
    if (!window.confirm("Are you sure you want to reject this session?")) return;

    setLoading(true);

    try {
      const res = await API.put(`/sessions/${sessionId}/status`, {
        status: "rejected",
      });

      showMessage("success", res.data.message || "Session rejected");
      fetchSessions();
    } catch (err) {
      console.error("Reject session error:", err);
      const msg = err.response?.data?.message || "Failed to reject session";
      showMessage("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { background: "#F59E0B20", color: "#F59E0B", label: "Pending" },
      accepted: { background: "#22C55E20", color: "#22C55E", label: "Accepted" },
      rejected: { background: "#EF444420", color: "#EF4444", label: "Rejected" },
      completed: { background: "#3B82F620", color: "#3B82F6", label: "Completed" },
      cancelled: { background: "#71717A20", color: "#71717A", label: "Cancelled" },
    };
    const s = styles[status] || styles.pending;
    return (
      <span
        style={{
          background: s.background,
          color: s.color,
          padding: "0.25rem 0.75rem",
          borderRadius: "20px",
          fontSize: "0.75rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {s.label}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime12h = (time24h) => {
    if (!time24h) return "";
    const [hours, minutes] = time24h.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
  };

  return (
    <div className="sessions-page">
      <nav className="sessions-topnav" aria-label="Sessions navigation">
        <div className="sessions-topnav-brand" onClick={() => navigate("/dashboard")}>
          <div className="tnav-icon">⚡</div>
          <span>Skill<span className="tnav-accent">Swap</span></span>
        </div>
        <button className="sessions-back-btn" onClick={() => navigate("/dashboard")}>
          ← Dashboard
        </button>
      </nav>

      <div className="sessions-container">
        <h2 className="sessions-title">
          Schedule Session <span className="title-icon">📅</span>
        </h2>

        {message.text && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              fontSize: "0.88rem",
              fontWeight: 600,
              background: message.type === "error" ? "#EF444420" : "#22C55E20",
              color: message.type === "error" ? "#EF4444" : "#22C55E",
              border: `1px solid ${message.type === "error" ? "#EF444440" : "#22C55E40"}`,
            }}
          >
            {message.text}
          </div>
        )}

        <div className="session-form">
          {!learnerId && (
            <select
              value={selectedLearnerId}
              onChange={(e) => setSelectedLearnerId(e.target.value)}
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                backgroundColor: "#0B0B0F",
                border: "1px solid #2A2A2A",
                borderRadius: "12px",
                color: selectedLearnerId ? "#FFFFFF" : "#6B6B6B",
                fontSize: "0.92rem",
                fontFamily: "inherit",
                outline: "none",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              <option value="">Select a learner...</option>
              {connections.map((conn) => (
                <option key={conn._id} value={conn._id}>
                  {conn.username} {conn.email ? `(${conn.email})` : ""}
                </option>
              ))}
            </select>
          )}

          {learnerId && (
            <input value={learnerName || "Selected Learner"} disabled />
          )}

          <input
            placeholder="Topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={loading}
          />

          <input
            type="date"
            value={date}
            min={getTodayString()}
            onChange={(e) => setDate(e.target.value)}
            disabled={loading}
          />

          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={loading}
          />

          <input
            placeholder="Google Meet Link (optional)"
            value={meetLink}
            onChange={(e) => setMeetLink(e.target.value)}
            disabled={loading}
          />

          <button
            className="create-btn"
            onClick={handleCreate}
            disabled={loading}
            style={loading ? { opacity: 0.7, cursor: "not-allowed" } : {}}
          >
            {loading ? "Creating..." : "Create Session"}
          </button>
        </div>

        <div className="sessions-grid">
          {fetching ? (
            <div style={{ color: "#A3A3A3", padding: "2rem", textAlign: "center" }}>
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div
              style={{
                padding: "2rem",
                borderRadius: "16px",
                background: "#161616",
                border: "1px solid #2A2A2A",
                color: "#71717A",
                textAlign: "center",
              }}
            >
              No sessions yet. Schedule your first session above.
            </div>
          ) : (
            sessions.map((session) => {
              const isTeacher = String(session.teacher?._id) === String(currentUserId);
              const isLearner = String(session.learner?._id) === String(currentUserId);
              const canEdit = isTeacher && session.status !== "cancelled";
              const canCancel = (isTeacher || isLearner) && session.status !== "cancelled";
              const canAcceptReject = isLearner && session.status === "pending";

              return (
                <div className="session-card" key={session._id}>
                  <div className="session-top">
                    <h3 className="session-topic">📘 {session.topic}</h3>
                    {getStatusBadge(session.status)}
                  </div>

                  <div className="session-details">
                    <p>
                      <strong>Teacher:</strong> {session.teacher?.username || "Unknown"}
                    </p>
                    <p>
                      <strong>Learner:</strong> {session.learner?.username || "Unknown"}
                    </p>
                    <p>📅 {formatDate(session.date)}</p>
                    <p>⏰ {formatTime12h(session.time)}</p>
                    {session.meetLink && (
                      <p>
                        <strong>Meet:</strong>{" "}
                        <a
                          href={session.meetLink}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#FF7A18" }}
                        >
                          Join Link
                        </a>
                      </p>
                    )}
                  </div>

                  {editingId === session._id ? (
                    <div className="session-form" style={{ background: "#0B0B0F", padding: "1rem" }}>
                      <input
                        placeholder="Topic"
                        value={editTopic}
                        onChange={(e) => setEditTopic(e.target.value)}
                        disabled={loading}
                      />
                      <input
                        type="date"
                        value={editDate}
                        min={getTodayString()}
                        onChange={(e) => setEditDate(e.target.value)}
                        disabled={loading}
                      />
                      <input
                        type="time"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        disabled={loading}
                      />
                      <input
                        placeholder="Google Meet Link"
                        value={editMeetLink}
                        onChange={(e) => setEditMeetLink(e.target.value)}
                        disabled={loading}
                      />
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          className="create-btn"
                          onClick={handleUpdate}
                          disabled={loading}
                          style={{ flex: 1 }}
                        >
                          {loading ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          disabled={loading}
                          style={{
                            flex: 1,
                            padding: "0.75rem",
                            background: "transparent",
                            color: "#A3A3A3",
                            border: "1px solid #2A2A2A",
                            borderRadius: "12px",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {canAcceptReject && (
                        <>
                          <button
                            onClick={() => handleAccept(session._id)}
                            disabled={loading}
                            style={{
                              flex: 1,
                              padding: "0.6rem",
                              background: "#22C55E",
                              color: "#fff",
                              border: "none",
                              borderRadius: "12px",
                              cursor: "pointer",
                              fontWeight: 700,
                              fontSize: "0.85rem",
                            }}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleReject(session._id)}
                            disabled={loading}
                            style={{
                              flex: 1,
                              padding: "0.6rem",
                              background: "#EF4444",
                              color: "#fff",
                              border: "none",
                              borderRadius: "12px",
                              cursor: "pointer",
                              fontWeight: 700,
                              fontSize: "0.85rem",
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {canEdit && (
                        <button
                          onClick={() => handleEdit(session)}
                          disabled={loading}
                          style={{
                            flex: 1,
                            padding: "0.6rem",
                            background: "transparent",
                            color: "#FF7A18",
                            border: "1px solid rgba(255, 122, 24, 0.3)",
                            borderRadius: "12px",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                          }}
                        >
                          Edit
                        </button>
                      )}

                      {canCancel && (
                        <button
                          onClick={() => handleCancel(session._id)}
                          disabled={loading}
                          style={{
                            flex: 1,
                            padding: "0.6rem",
                            background: "transparent",
                            color: "#EF4444",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: "12px",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                          }}
                        >
                          Cancel
                        </button>
                      )}

                      {session.meetLink && session.status === "accepted" && (
                        <a
                          href={session.meetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="join-btn"
                          style={{ flex: 1, textAlign: "center", textDecoration: "none" }}
                        >
                          Join Meeting 🎥
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Sessions;
