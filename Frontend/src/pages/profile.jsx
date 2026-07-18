import { useEffect, useState } from "react";
import API from "../services/api";
import ProfileCard from "../components/ProfileCard";
import EditProfileForm from "../components/EditProfileForm";
import "./profile.css";

function Profile() {
  const [user, setUser] = useState(null);
  const [edit, setEdit] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/users/profile");
      setUser(res.data.user);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-page-shell">
        <div className="page-heading">
          <p className="eyebrow">SkillSwap workspace</p>
          <h2>My Profile</h2>
          <p className="page-subtitle">
            Keep your professional profile polished and easy to discover.
          </p>
        </div>

        {edit ? (
          <EditProfileForm user={user} setEdit={setEdit} refresh={fetchProfile} />
        ) : (
          <ProfileCard user={user} setEdit={setEdit} />
        )}
      </div>
    </div>
  );
}

export default Profile;
