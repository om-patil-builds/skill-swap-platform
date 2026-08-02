import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import ProfileCard from "../components/ProfileCard";
import EditProfileForm from "../components/EditProfileForm";
import "./profile.css";

function Profile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = !id;

  const fetchProfile = async () => {
    setLoading(true);
    try {
      let res;
      if (id) {
        res = await API.get(`/users/${id}`);
      } else {
        res = await API.get("/users/profile");
      }
      setUser(res.data.user || res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">Loading profile…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-loading">User not found</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* ── Top Nav ── */}
      <nav className="profile-topnav" aria-label="Profile navigation">
        <div className="profile-topnav-brand" onClick={() => navigate("/dashboard")}>
          <div className="tnav-icon">⚡</div>
          <span>Skill<span className="tnav-accent">Swap</span></span>
        </div>
        <button className="profile-back-btn" onClick={() => navigate("/dashboard")}>
          ← Dashboard
        </button>
      </nav>

      <div className="profile-page-shell">
        <div className="page-heading">
          <p className="eyebrow">SkillSwap workspace</p>
          <h2>{isOwnProfile ? "My Profile" : `${user.username || "User"}'s Profile`}</h2>
          <p className="page-subtitle">
            {isOwnProfile
              ? "Keep your professional profile polished and easy to discover."
              : "View this user's skills and profile information."}
          </p>
        </div>

        {edit && isOwnProfile ? (
          <EditProfileForm user={user} setEdit={setEdit} refresh={fetchProfile} />
        ) : (
          <ProfileCard user={user} setEdit={setEdit} isOwnProfile={isOwnProfile} refresh={fetchProfile} />
        )}
      </div>
    </div>
  );
}

export default Profile;
