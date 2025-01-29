import React, { useState, useEffect } from "react";
import { auth } from "../firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Profile = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        try {
          const response = await axios.get("http://localhost:5000/api/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setProfilePicUrl(response.data.profile_pic_url);
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }
    };

    onAuthStateChanged(auth, (user) => {
      if (user) fetchProfile();
      else navigate("/login");
    });
  }, [navigate]);

  const handleProfilePicUpload = (e) => {
    setProfilePic(e.target.files[0]);
  };

  const handleSave = async () => {
    if (!profilePic) {
      alert("Please select a profile picture!");
      return;
    }

    setLoading(true);
    const user = auth.currentUser;
    const token = await user.getIdToken();
    const formData = new FormData();
    formData.append("profilePic", profilePic);

    try {
      const response = await axios.post("http://localhost:5000/api/profile", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setProfilePicUrl(response.data.user.profile_pic_url);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error saving profile picture.");
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      alert("You have been signed out.");
      navigate("/register");
    } catch (error) {
      console.error("Sign out error:", error.message);
      alert("Error signing out. Try again.");
    }
  };

  return (
    <div>
      <h2>Profile</h2>
      {profilePicUrl && <img src={`http://localhost:5000${profilePicUrl}`} alt="Profile" width={150} />}
      <input type="file" onChange={handleProfilePicUpload} />
      <button onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : "Save Profile Picture"}
      </button>
      <button onClick={handleSignOut} style={{ marginTop: "10px", backgroundColor: "red", color: "white" }}>
        Sign Out
      </button>
    </div>
  );
};

export default Profile;
