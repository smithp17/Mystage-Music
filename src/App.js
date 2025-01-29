import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Profile from "./components/Profile";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Register />} />  {/* Show Register first */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;
