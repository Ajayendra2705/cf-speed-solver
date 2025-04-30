import React, { useState, useEffect } from "react";
import axios from "axios";
import "./HomePage.css";

const StatItem = ({ label, value }) => (
  <div className="stat-item">
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
  </div>
);

const HomePage = () => {
  const [handle, setHandle] = useState(localStorage.getItem("cfHandle") || "");
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (handle.length < 3) {
      setUserInfo(null);
      setError("");
      return;
    }
    setIsLoading(true);
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `https://codeforces.com/api/user.info?handles=${handle}`
        );
        if (response.data.status === "OK") {
          setUserInfo(response.data.result[0]);
          setError("");
        }
      } catch (err) {
        setError("❌ Invalid handle. Please check again.");
        setUserInfo(null);
      } finally {
        setIsLoading(false);
      }
    };
    const debounceTimer = setTimeout(fetchData, 500);
    return () => clearTimeout(debounceTimer);
  }, [handle]);

  const handleInputChange = (e) => {
    const newHandle = e.target.value.replace(/\s/g, "");
    setHandle(newHandle);
    localStorage.setItem("cfHandle", newHandle);
  };

  const handleClearStorage = () => {
    setHandle("");
    localStorage.removeItem("cfHandle");
    setUserInfo(null);
    setError("");
  };

  return (
    <div className="profile-section">
      <div className="profile-card-landing">
        <div className="profile-card-left">
          <h1 className="profile-title">Codeforces Profile Finder</h1>
          <div className="input-row">
            <input
              type="text"
              value={handle}
              onChange={handleInputChange}
              placeholder="Enter Codeforces handle"
              className="handle-input"
              aria-label="Codeforces handle input"
              autoFocus
            />
            {handle && (
              <button
                onClick={handleClearStorage}
                className="clear-btn"
                aria-label="Clear input"
              >
                ×
              </button>
            )}
          </div>
          {isLoading && (
            <div className="loader-container">
              <div className="loader"></div>
            </div>
          )}
          {error && <p className="error-message">{error}</p>}
          {userInfo && (
            <div className="profile-details-landing fade-in">
              <h2 className="user-handle">{userInfo.handle}</h2>
              <div className="stats-row-landing">
                <StatItem label="Rank" value={userInfo.rank} />
                <StatItem label="Rating" value={userInfo.rating} />
                <StatItem label="Max Rating" value={userInfo.maxRating} />
                <StatItem label="Country" value={userInfo.country || "Unknown"} />
              </div>
              <a
                href={`https://codeforces.com/profile/${handle}`}
                className="profile-link-btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Full Profile →
              </a>
            </div>
          )}
        </div>
        <div className="profile-card-right">
          <img
            src={
              userInfo
                ? userInfo.avatar
                : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            }
            alt="Profile avatar"
            className="profile-avatar-landing"
            onError={e =>
              (e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png")
            }
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
