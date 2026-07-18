import MatchCard from "./MatchCard";
import "./MatchCard.css";

function Matches({ users = [], handleConnect }) {
  return (
    <div className="matches-grid">
      {users.map((user) => (
        <MatchCard
          key={user._id}
          user={user}
          status={user.status}
          onConnect={handleConnect}
        />
      ))}
    </div>
  );
}

export default Matches;