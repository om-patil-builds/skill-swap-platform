import { useEffect, useState } from "react";
import API from "../services/api";
import "./Requests.css";

function Requests() {
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

  const handleAction = async (id, status) => {
    try {
      await API.put(`/requests/${id}`, { status });
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="requests-page">
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