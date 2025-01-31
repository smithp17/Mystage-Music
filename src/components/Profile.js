import React, { useState, useEffect } from "react";
import { auth } from "../firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BASE_URL = "http://localhost:5000"; // ✅ Change this when deploying

const Profile = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        try {
          const response = await axios.get(`${BASE_URL}/api/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.data.profile_pic_url) {
            setProfilePicUrl(response.data.profile_pic_url);
          }
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
    setProcessing(true);
    const user = auth.currentUser;
    const token = await user.getIdToken();
    const formData = new FormData();
    formData.append("profilePic", profilePic);

    try {
      await axios.post(`${BASE_URL}/api/profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Profile picture uploaded! Processing...");

      // Poll for processed image
      pollForProcessedImage(user, token);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error saving profile picture.");
      setProcessing(false);
    }

    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!profilePic) {
      alert("Please select a new profile picture!");
      return;
    }

    setLoading(true);
    setProcessing(true);
    const user = auth.currentUser;
    const token = await user.getIdToken();
    const formData = new FormData();
    formData.append("profilePic", profilePic);

    try {
      await axios.put(`${BASE_URL}/api/profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Profile picture updated! Processing...");

      // Poll for processed image
      pollForProcessedImage(user, token);
    } catch (error) {
      console.error("Error updating profile picture:", error);
      alert("Error updating profile picture.");
      setProcessing(false);
    }

    setLoading(false);
  };

  const pollForProcessedImage = async (user, token) => {
    let attempts = 0;
    const maxAttempts = 10;
    const delay = 3000; // Poll every 3 seconds

    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(`${BASE_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.profile_pic_url) {
          setProfilePicUrl(response.data.profile_pic_url);
          alert("Profile picture updated successfully!");
          setProcessing(false);
          return;
        }
      } catch (error) {
        console.error("Error polling for processed image:", error);
      }

      attempts++;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    alert("Profile picture processing took too long. Try refreshing later.");
    setProcessing(false);
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete your profile?");
    if (!confirmDelete) return;

    setLoading(true);
    const user = auth.currentUser;
    const token = await user.getIdToken();

    try {
      await axios.delete(`${BASE_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Profile deleted successfully!");
      await signOut(auth);
      navigate("/register");
    } catch (error) {
      console.error("Error deleting profile:", error);
      alert("Error deleting profile.");
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white shadow-lg rounded-lg p-6 max-w-lg w-full text-center">
        <h2 className="text-3xl font-semibold mb-4 text-gray-900">Profile</h2>

        <div className="flex justify-center">
          {profilePicUrl ? (
            <img
              src={profilePicUrl}
              alt="Profile"
              className="w-32 h-32 rounded-full shadow-lg border border-gray-300"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              {processing ? "Processing..." : "No Image"}
            </div>
          )}
        </div>

        <label className="mt-4 block text-gray-700 font-medium">
          Upload Profile Picture
          <input type="file" className="hidden" onChange={handleProfilePicUpload} />
        </label>

        <div className="mt-4 space-y-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition flex items-center justify-center"
          >
            {loading ? "Saving..." : "Save Profile Picture"}
          </button>

          <button
            onClick={handleUpdate}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition flex items-center justify-center"
          >
            {loading ? "Updating..." : "Update Profile Picture"}
          </button>

          <button
            onClick={handleDelete}
            disabled={loading}
            className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-900 transition flex items-center justify-center"
          >
            {loading ? "Deleting..." : "Delete Profile"}
          </button>

          <button
            onClick={handleSignOut}
            className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition flex items-center justify-center"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
