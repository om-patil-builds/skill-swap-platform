import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Connections.css";

function Connections() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  const fetchConnections = async () => {
    try {
      const res = await API.get("/requests/accepted");
      setUsers(res.data.users || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  return (
    <div className="connections-page">
      <div className="connections-shell">
        <div className="connections-header">
          <div>
            <p className="page-eyebrow">Your network</p>
            <h2>Your Connections</h2>
            <p className="page-subtitle">
              Continue conversations with the people you’ve already connected with.
            </p>
          </div>
          <div className="connections-pill">{users.length} connected</div>
        </div>

        {users.length === 0 ? (
          <div className="connections-state empty">No connections yet</div>
        ) : (
          <div className="connections-list">
            {users.map((user) => {
              const skills = Array.isArray(user.skillsHave) ? user.skillsHave : [];

              return (
                <div key={user._id} className="connection-card">
                  <div className="info">
                    <div className="avatar-badge">
                      {(user.username || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3>{user.username || "Unknown user"}</h3>
                      <p>{user.email || "No email provided"}</p>
                      <p>
                        <b>Skills:</b> {skills.length > 0 ? skills.join(", ") : "No skills listed"}
                      </p>
                    </div>
                  </div>

                  <button
                    className="chat-btn"
                    onClick={() => navigate(`/chat/${user._id}`)}
                  >
                    Open chat
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Connections;