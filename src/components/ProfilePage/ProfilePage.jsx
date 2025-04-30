import React, { useEffect, useState } from "react";
import { Line, Bar, Doughnut, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";
import axios from "axios";
import "./ProfilePage.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ProfilePage = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [contestHistory, setContestHistory] = useState([]);
  const [solvedQuestionsByRating, setSolvedQuestionsByRating] = useState({});
  const [topicsSolved, setTopicsSolved] = useState({});
  const [error, setError] = useState(null);
  const [totalContests, setTotalContests] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [totalAccepted, setTotalAccepted] = useState(0); // Added total accepted solutions

  const handle = localStorage.getItem("cfHandle"); // Getting handle from localStorage

  useEffect(() => {
    if (handle) {
      fetchUserInfo(handle);
      fetchContestHistory(handle);
      fetchSolvedQuestionsByRating(handle);
      fetchTopicsSolved(handle);
    }
  }, [handle]);

  const fetchUserInfo = async (userHandle) => {
    try {
      const response = await axios.get(
        `https://codeforces.com/api/user.info?handles=${userHandle}`
      );
      if (response.data.status === "OK") {
        setUserInfo(response.data.result[0]);
        setError(null); // Reset any errors if the data is fetched successfully
      } else {
        setError("❌ Could not fetch user data. Please check the handle.");
      }
    } catch (err) {
      setError("❌ An error occurred while fetching the data.");
    }
  };

  const fetchContestHistory = async (userHandle) => {
    try {
      const response = await axios.get(
        `https://codeforces.com/api/user.rating?handle=${userHandle}`
      );
      if (response.data.status === "OK") {
        setContestHistory(response.data.result);
        setTotalContests(response.data.result.length); // Count contests
        setError(null);
      } else {
        setError("❌ Could not fetch contest history.");
      }
    } catch (err) {
      setError("❌ An error occurred while fetching the contest history.");
    }
  };

  const fetchSolvedQuestionsByRating = async (userHandle) => {
    try {
      const response = await axios.get(
        `https://codeforces.com/api/user.status?handle=${userHandle}`
      );
      if (response.data.status === "OK") {
        const submissions = response.data.result;
        const solvedByRating = {};
        let acceptedCount = 0; // Counter for total accepted solutions

        submissions.forEach((submission) => {
          if (submission.verdict === "OK") {
            acceptedCount++; // Increment accepted solutions count
            const problemRating = submission.problem.rating;
            if (problemRating) {
              solvedByRating[problemRating] = (solvedByRating[problemRating] || 0) + 1;
            }
          }
        });

        setSolvedQuestionsByRating(solvedByRating);
        setTotalSubmissions(submissions.length); // Count submissions
        setTotalAccepted(acceptedCount); // Set total accepted solutions
      }
    } catch (err) {
      setError("❌ An error occurred while fetching the solved questions data.");
    }
  };

  const fetchTopicsSolved = async (userHandle) => {
    try {
      const response = await axios.get(
        `https://codeforces.com/api/user.status?handle=${userHandle}`
      );
      if (response.data.status === "OK") {
        const submissions = response.data.result;
        const topics = {};

        submissions.forEach((submission) => {
          if (submission.verdict === "OK") {
            const topic = submission.problem.tags[0]; // Assuming the first tag is the topic
            if (topic) {
              topics[topic] = (topics[topic] || 0) + 1;
            }
          }
        });

        setTopicsSolved(topics);
      }
    } catch (err) {
      setError("❌ An error occurred while fetching the topics solved data.");
    }
  };

  const ratingHistoryData = {
    labels: contestHistory.map((contest) => new Date(contest.ratingUpdateTimeSeconds * 1000).toLocaleDateString()),
    datasets: [
      {
        label: "Rating",
        data: contestHistory.map((contest) => contest.newRating),
        borderColor: "rgba(75, 192, 192, 1)", // Blue color for line
        backgroundColor: "rgba(75, 192, 192, 0.2)", // Light blue background for the chart
        tension: 0.4,
        fill: true,  // Filling area below the line
      },
    ],
  };
  
  

  const solvedByRatingData = {
    labels: Object.keys(solvedQuestionsByRating).filter((rating) => solvedQuestionsByRating[rating] > 0),
    datasets: [
      {
        label: "Solved Problems",
        data: Object.values(solvedQuestionsByRating).filter((count) => count > 0),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
    ],
  };

  const topicsSolvedData = {
    labels: Object.keys(topicsSolved),
    datasets: [
      {
        label: "Solved Topics",
        data: Object.values(topicsSolved),
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
        ],
      },
    ],
  };

  const verdictsData = {
    labels: ["Accepted", "Wrong Answer", "Time Limit Exceeded", "Runtime Error"],
    datasets: [
      {
        data: [
          totalAccepted, // Use the totalAccepted count here
          30, // Replace with actual verdict counts
          10,
          5
        ],
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(153, 102, 255, 0.6)",
        ],
      },
    ],
  };

  return (
    <div className="profile-page">
      <div className="user-details">
        {userInfo ? (
          <>
            <div className="avatar-container">
              <img src={userInfo.avatar} alt="User Avatar" className="profile-avatar" />
            </div>
            <div className="profile-info">
              <h2>{userInfo.handle}</h2>
              <p><strong>Rank:</strong> {userInfo.rank || "Not Available"}</p>
              <p><strong>Rating:</strong> {userInfo.rating}</p>
              <p><strong>Max Rating:</strong> {userInfo.maxRating}</p>
              <p><strong>Country:</strong> {userInfo.country || "Not specified"}</p>
            </div>
          </>
        ) : (
          <p className="loading-text">Loading profile...</p>
        )}
      </div>

      <div className="metrics">
        <div className="metric-card">
          <h3>Total Contests</h3>
          <p>{totalContests}</p>
        </div>
        <div className="metric-card">
          <h3>Total Submissions</h3>
          <p>{totalSubmissions}</p>
        </div>
        <div className="metric-card">
          <h3>Total Accepted Solutions</h3>
          <p>{totalAccepted}</p>
        </div>
      </div>

      <div className="charts">
        <div className="chart-container">
          <h2>Rating History</h2>
          <Line data={ratingHistoryData} options={{ responsive: true }} />
        </div>

        <div className="chart-container">
          <h2>Solved Questions by Rating</h2>
          <Bar data={solvedByRatingData} options={{ responsive: true }} />
        </div>

        <div className="chart-container">
          <h2>Topics Solved</h2>
          <Pie data={topicsSolvedData} options={{ responsive: true }} />
        </div>

        <div className="chart-container">
          <h2>Verdict Distribution</h2>
          <Doughnut data={verdictsData} options={{ responsive: true }} />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
