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
  const [totalAccepted, setTotalAccepted] = useState(0);

  const handle = localStorage.getItem("cfHandle");

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
        setError(null);
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
        setTotalContests(response.data.result.length);
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
        let acceptedCount = 0;

        submissions.forEach((submission) => {
          if (submission.verdict === "OK") {
            acceptedCount++;
            const problemRating = submission.problem.rating;
            if (problemRating) {
              solvedByRating[problemRating] = (solvedByRating[problemRating] || 0) + 1;
            }
          }
        });

        setSolvedQuestionsByRating(solvedByRating);
        setTotalSubmissions(submissions.length);
        setTotalAccepted(acceptedCount);
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
            const topic = submission.problem.tags[0];
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

  // Modern 2025 color palette (purple, blue, green, yellow, red, clay, etc.)
  const chartColors = [
    "#844fc1", "#3b86d1", "#21bf06", "#ffc93c", "#bf1922",
    "#c99383", "#b17a50", "#00cfc8", "#facf39", "#112d4e"
  ];

  const ratingHistoryData = {
    labels: contestHistory.map((contest) =>
      new Date(contest.ratingUpdateTimeSeconds * 1000).toLocaleDateString()
    ),
    datasets: [
      {
        label: "Rating",
        data: contestHistory.map((contest) => contest.newRating),
        borderColor: "#3b86d1",
        backgroundColor: "rgba(132, 79, 193, 0.10)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#844fc1",
        pointBorderColor: "#3b86d1",
      },
    ],
  };

  const solvedByRatingData = {
    labels: Object.keys(solvedQuestionsByRating).filter(
      (rating) => solvedQuestionsByRating[rating] > 0
    ),
    datasets: [
      {
        label: "Solved Problems",
        data: Object.values(solvedQuestionsByRating).filter((count) => count > 0),
        backgroundColor: chartColors,
      },
    ],
  };

  const topicsSolvedData = {
    labels: Object.keys(topicsSolved),
    datasets: [
      {
        label: "Solved Topics",
        data: Object.values(topicsSolved),
        backgroundColor: chartColors,
      },
    ],
  };

  const verdictsData = {
    labels: ["Accepted", "Wrong Answer", "Time Limit Exceeded", "Runtime Error"],
    datasets: [
      {
        data: [
          totalAccepted,
          30,
          10,
          5,
        ],
        backgroundColor: [
          "#21bf06", "#bf1922", "#ffc93c", "#3b86d1"
        ],
      },
    ],
  };

  // Chart.js options with aspect ratios and modern color
  const lineBarOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: "#e5e7eb" }, ticks: { color: "#6c7293" } },
      y: { grid: { color: "#e5e7eb" }, ticks: { color: "#6c7293" } }
    }
  };

  const pieDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.2,
    plugins: {
      legend: { position: "bottom", labels: { color: "#374151", font: { size: 15 } } }
    }
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
        <div className="metric-card metric-accent1">
          <h3>Total Contests</h3>
          <p>{totalContests}</p>
        </div>
        <div className="metric-card metric-accent2">
          <h3>Total Submissions</h3>
          <p>{totalSubmissions}</p>
        </div>
        <div className="metric-card metric-accent3">
          <h3>Total Accepted Solutions</h3>
          <p>{totalAccepted}</p>
        </div>
      </div>

      <div className="charts">
        <div className="chart-container chart-wide">
          <h2>Rating History</h2>
          <Line data={ratingHistoryData} options={lineBarOptions} />
        </div>
        <div className="chart-container chart-wide">
          <h2>Solved Questions by Rating</h2>
          <Bar data={solvedByRatingData} options={lineBarOptions} />
        </div>
        <div className="chart-container chart-square">
          <h2>Topics Solved</h2>
          <Pie data={topicsSolvedData} options={pieDoughnutOptions} />
        </div>
        <div className="chart-container chart-square">
          <h2>Verdict Distribution</h2>
          <Doughnut data={verdictsData} options={{ ...pieDoughnutOptions, cutout: "70%" }} />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
