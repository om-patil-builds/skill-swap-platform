import { useState } from "react";
import API from "../services/api";
import "./EditProfileForm.css";

function EditProfileForm({ user, setEdit, refresh }) {
  const [bio, setBio] = useState(user.bio);
  const [skillsHave, setSkillsHave] = useState(user.skillsHave.join(", "));
  const [skillsWant, setSkillsWant] = useState(user.skillsWant.join(", "));

  const handleSubmit = async () => {
    try {
      await API.put("/users/profile", {
        bio,
        skillsHave: skillsHave.split(",").map((s) => s.trim()),
        skillsWant: skillsWant.split(",").map((s) => s.trim()),
      });

      setEdit(false);
      refresh();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="edit-profile-card">
      <h2>Edit Profile</h2>
      <p className="subtitle">
        Keep your profile updated so others can find your skills.
      </p>

      <div className="form-group">
        <label>Bio</label>
        <textarea
          rows="4"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell something about yourself..."
        />
      </div>

      <div className="form-group">
        <label>Skills You Have</label>
        <input
          type="text"
          value={skillsHave}
          onChange={(e) => setSkillsHave(e.target.value)}
          placeholder="React, Node.js, MongoDB"
        />
      </div>

      <div className="form-group">
        <label>Skills You Want</label>
        <input
          type="text"
          value={skillsWant}
          onChange={(e) => setSkillsWant(e.target.value)}
          placeholder="Docker, AWS, TypeScript"
        />
      </div>

      <div className="button-group">
        <button className="save-btn" onClick={handleSubmit}>
          Save Changes
        </button>

        <button
          className="cancel-btn"
          onClick={() => setEdit(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default EditProfileForm;