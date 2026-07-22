import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Sessions.css";

function Sessions() {
  const location = useLocation();
  const navigate = useNavigate();

  const learnerId = location.state?.learnerId;
  const learnerName = location.state?.learnerName;

  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [meetLink, setMeetLink] = useState("");
  const [sessions, setSessions] = useState([]);

  const createSession = async () => {
    try {
      await API.post("/sessions", {
        learner: learnerId,
        topic,
        date,
        time,
        meetLink,
      });

      alert("Session Created Successfully ✅");

      setTopic("");
      setDate("");
      setTime("");
      setMeetLink("");
    } catch (err) {
      console.log(err);
      alert("Failed to create session ❌");
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await API.get(`/sessions/chat/${learnerId}`);
      console.log(res.data);
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (learnerId) {
      fetchSessions();
    }
  }, [learnerId]);

  return (
    <div className="sessions-page">
      {/* ── Top Nav ── */}
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
        <h2 className="sessions-title">Schedule Session <span className="title-icon">📅</span></h2>

        <div className="session-form">
          <input value={learnerName || ""} disabled placeholder="Learner" />

          <input
            placeholder="Topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />

          <input
            placeholder="Google Meet Link"
            value={meetLink}
            onChange={(e) => setMeetLink(e.target.value)}
          />

          <button className="create-btn" onClick={createSession}>
            Create Session
          </button>
        </div>

        <div className="sessions-grid">
          {sessions.map((session) => (
            <div className="session-card" key={session._id}>
              <div className="session-top">
                <h3 className="session-topic">📘 {session.topic}</h3>
              </div>

              <div className="session-details">
                <p>👨‍🏫 Teacher: {session.teacher?.username}</p>
                <p>👨‍🎓 Learner: {session.learner?.username}</p>
                <p>📅 {session.date}</p>
                <p>⏰ {session.time}</p>
              </div>

              <a
                href={session.meetLink}
                target="_blank"
                rel="noreferrer"
                className="join-btn"
              >
                Join Meeting 🎥
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Sessions;
