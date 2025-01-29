import React, { useState } from "react";
import { auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("User registered:", userCredential.user);
      alert("Registration successful! You can now log in.");
      navigate("/login"); // ✅ Redirect to login after successful registration
    } catch (error) {
      console.error("Registration error:", error.code, error.message);

      // ✅ Improved error messages
      if (error.code === "auth/email-already-in-use") {
        alert("This email is already registered. Try logging in.");
      } else if (error.code === "auth/weak-password") {
        alert("Weak password. Use at least 6 characters.");
      } else if (error.code === "auth/invalid-email") {
        alert("Invalid email format.");
      } else {
        alert(error.message);
      }
    }

    setLoading(false);
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      
      {/* ✅ Added link to Login */}
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
};

export default Register;
