import "./ProfileCard.css";

function ProfileCard({ user, setEdit }) {
  const skillsHave = Array.isArray(user.skillsHave) ? user.skillsHave : [];
  const skillsWant = Array.isArray(user.skillsWant) ? user.skillsWant : [];
  const initials = (user.username || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-avatar">{initials}</div>

        <div className="profile-card-body">
          <p className="profile-label">Professional overview</p>
          <h2>{user.username}</h2>
          <p className="profile-email">{user.email}</p>
          <p className="profile-bio">
            {user.bio || "Add a short bio to tell others more about your expertise."}
          </p>

          <div className="profile-stats-row">
            <div className="stat-chip">
              <strong>{skillsHave.length}</strong>
              <span>Shared skills</span>
            </div>
            <div className="stat-chip">
              <strong>{skillsWant.length}</strong>
              <span>Target skills</span>
            </div>
          </div>

          <div className="profile-skill-section">
            <div className="skill-section">
              <h4>Skills I Have</h4>
              {skillsHave.length > 0 ? (
                <div className="skills">
                  {skillsHave.map((skill, i) => (
                    <span key={i} className="skill-badge">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No shared skills added yet.</p>
              )}
            </div>

            <div className="skill-section">
              <h4>Skills I Want</h4>
              {skillsWant.length > 0 ? (
                <div className="skills">
                  {skillsWant.map((skill, i) => (
                    <span key={i} className="skill-badge alt">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No desired skills added yet.</p>
              )}
            </div>
          </div>

          <button className="edit-btn" onClick={() => setEdit(true)}>
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileCard;