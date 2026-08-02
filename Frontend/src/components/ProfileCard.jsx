import { useState } from "react";
import API from "../services/api";
import "./ProfileCard.css";

function ProfileCard({ user, setEdit, isOwnProfile = true, refresh }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const skillsHave = Array.isArray(user.skillsHave) ? user.skillsHave : [];
  const skillsWant = Array.isArray(user.skillsWant) ? user.skillsWant : [];
  
  const initials = (user.username || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side validations
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setError("Only JPG, JPEG, PNG, and WEBP images are allowed.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("File size must be less than 2MB.");
      return;
    }

    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      await API.put("/users/profile-picture", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (refresh) {
        await refresh();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to upload profile picture. Please try again.";
      setError(errMsg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header-section">
          <div className="profile-avatar-container">
            <div className="profile-avatar">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.username}
                  className="profile-avatar-img"
                />
              ) : (
                initials
              )}
            </div>
            {isOwnProfile && (
              <label className="upload-avatar-label">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  disabled={uploading}
                />
                <span className={`upload-avatar-btn ${uploading ? "disabled" : ""}`}>
                  {uploading ? "Uploading..." : "Change Photo"}
                </span>
              </label>
            )}
          </div>
          {error && <div className="profile-upload-error">{error}</div>}
        </div>

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

          {isOwnProfile && (
            <button className="edit-btn" onClick={() => setEdit(true)}>
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileCard;