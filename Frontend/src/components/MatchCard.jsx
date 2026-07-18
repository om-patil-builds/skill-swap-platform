import { useNavigate } from "react-router-dom";
import "./MatchCard.css";

function MatchCard({ user, status, onConnect }) {
  const navigate = useNavigate();

  const renderButton = () => {
    if (!status || status === "none") {
      return (
        <button className="btn connect" onClick={() => onConnect(user._id)}>
          Connect 🔗
        </button>
      );
    }

    if (status === "sent") {
      return (
        <button className="btn pending" disabled>
          Pending ⏳
        </button>
      );
    }

    if (status === "received") {
      return (
        <button className="btn accept" onClick={() => navigate("/requests")}>
          Accept 🔔
        </button>
      );
    }

    if (status === "accepted") {
      return (
        <button
          className="btn chat"
          onClick={() => navigate(`/chat/${user._id}`)}
        >
          Chat 💬
        </button>
      );
    }
  };

  return (
    <div className="match-card">
      <span className="match-badge">🔥 Match</span>

      <h3>{user.username}</h3>

      <p>{user.bio}</p>

      <div className="skills">
        <strong>Has:</strong>

        {user.skillsHave.map((s, i) => (
          <span key={i} className="skill have">
            {s}
          </span>
        ))}
      </div>

      <div className="skills">
        <strong>Wants:</strong>

        {user.skillsWant.map((s, i) => (
          <span key={i} className="skill want">
            {s}
          </span>
        ))}
      </div>

      {renderButton()}
    </div>
  );
}

export default MatchCard;