import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import socket from "../socket";
import "./Requests.css";

function Requests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await API.get("/requests/my");
      setRequests(res.data.requests || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentUserId = localStorage.getItem("userId");
    if (currentUserId) {
      socket.emit("join", currentUserId);
    }

    const markNotificationsRead = async () => {
      try {
        await API.put("/notifications/read-all");
      } catch (err) {
        console.log(err);
      }
    };
    markNotificationsRead();
    fetchRequests();
  }, []);

  useEffect(() => {
    const handleRequestUpdated = () => {
      fetchRequests();
    };

    socket.on("requestUpdated", handleRequestUpdated);

    return () => {
      socket.off("requestUpdated", handleRequestUpdated);
    };
  }, [fetchRequests]);

  const handleAction = async (id, status) => {
    try {
      await API.put(`/requests/${id}`, { status });
      setRequests((prev) => prev.filter((r) => r._id !== id));
      fetchRequests();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="requests-page">
      {/* ── Top Nav ── */}
      <nav className="requests-topnav" aria-label="Requests navigation">
        <div className="requests-topnav-brand" onClick={() => navigate("/dashboard")}>
          <div className="tnav-icon">⚡</div>
          <span>Skill<span className="tnav-accent">Swap</span></span>
        </div>
        <button className="requests-back-btn" onClick={() => navigate("/dashboard")}>
          ← Dashboard
        </button>
      </nav>

      <div className="requests-shell">
        <div className="requests-header">
          <div>
            <p className="page-eyebrow">Collaboration requests</p>
            <h2>Requests</h2>
            <p className="page-subtitle">
              Review incoming skill-swap invitations and respond quickly.
            </p>
          </div>
          <div className="requests-pill">{requests.length} pending</div>
        </div>

        {loading ? (
          <div className="requests-state">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="requests-state empty">No pending requests</div>
        ) : (
          <div className="requests-list">
            {requests.map((req) => {
              const sender = req.sender || {};
              const skills = Array.isArray(sender.skillsHave) ? sender.skillsHave : [];

              return (
                <div key={req._id} className="request-card">
                  <div className="user-info">
                    <div className="avatar-badge">
                      {(sender.username || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3>{sender.username || "Unknown user"}</h3>
                      <p>{sender.email || "No email provided"}</p>
                      <p>
                        <b>Skills:</b> {skills.length > 0 ? skills.join(", ") : "No skills listed"}
                      </p>
                    </div>
                  </div>

                  <div className="actions">
                    <button
                      className="accept"
                      onClick={() => handleAction(req._id, "accepted")}
                    >
                      Accept
                    </button>

                    <button
                      className="reject"
                      onClick={() => handleAction(req._id, "rejected")}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Requests;