import React, { useState, useEffect } from "react";
import axios from "axios";
import "./HomePage.css";

const HomePage = () => {
  const [handle, setHandle] = useState(localStorage.getItem("cfHandle") || ""); // Get handle from localStorage if it exists
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (handle.length > 2) {
      const timeout = setTimeout(() => {
        fetchUserInfo(handle);
      }, 1000);
      return () => clearTimeout(timeout); // Cleanup timeout on handle change
    }
  }, [handle]);

  const fetchUserInfo = async (userHandle) => {
    try {
      const response = await axios.get(`https://codeforces.com/api/user.info?handles=${userHandle}`);
      if (response.data.status === "OK") {
        setUserInfo(response.data.result[0]);
        setError(""); // Reset any previous errors
      }
    } catch (err) {
      setError("❌ Invalid handle. Please check again.");
      setUserInfo(null);
    }
  };

  const handleInputChange = (e) => {
    const newHandle = e.target.value;
    setHandle(newHandle);
    localStorage.setItem("cfHandle", newHandle); // Save handle to localStorage
  };

  return (
    <div className="homepage">
      <div className="form-container">
        <h1>Enter your Codeforces Handle</h1>
        <input
          type="text"
          value={handle}
          onChange={handleInputChange} // Save input handle to state and localStorage
          placeholder="e.g. tourist"
          className="handle-input"
        />
        {error && <p className="error">{error}</p>}

        {userInfo && (
          <div className="user-summary">
            <p className="success">✅ Handle recognized! Here's your info:</p>
            <div className="card">
              <img src={userInfo.avatar} alt="avatar" />
              <div className="info">
                <h2>{userInfo.handle}</h2>
                <p>Rank: {userInfo.rank}</p>
                <p>Rating: {userInfo.rating}</p>
                <p>Max Rating: {userInfo.maxRating}</p>
                <p>Country: {userInfo.country || "Not specified"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
