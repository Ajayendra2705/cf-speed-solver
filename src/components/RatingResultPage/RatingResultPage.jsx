import React, { useState, useRef, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { estimateRating } from '../../utils/estimateRating';
import './RatingResultPage.css';

// Helper: extract problem details
const extractProblemDetails = (url) => {
  const regex1 = /codeforces\.com\/problemset\/problem\/(\d+)\/([A-Za-z0-9]+)/;
  const regex2 = /codeforces\.com\/contest\/(\d+)\/problem\/([A-Za-z0-9]+)/;
  let match = url.match(regex1) || url.match(regex2);
  return match ? { contestId: Number(match[1]), problemIndex: match[2] } : null;
};

// Fetch problem info
const fetchProblemInfo = async (contestId, problemIndex) => {
  try {
    const response = await fetch(
      `https://codeforces.com/api/contest.standings?contestId=${contestId}&from=1&count=5000`
    );
    const data = await response.json();
    if (data.status === 'OK') {
      return {
        problem: data.result.problems.find(p => p.index === problemIndex) || null,
        rows: data.result.rows || [],
      };
    }
  } catch {
    return { problem: null, rows: [] };
  }
  return { problem: null, rows: [] };
};

// Fetch contest info
const fetchContestInfo = async (contestId) => {
  try {
    const response = await fetch('https://codeforces.com/api/contest.list');
    const data = await response.json();
    if (data.status === 'OK') {
      return data.result.find(contest => contest.id === contestId) || null;
    }
  } catch {
    return null;
  }
};

// Fetch all submissions for the problem
const fetchAllSubmissions = async (handle, contestId, problemIndex) => {
  try {
    const response = await fetch(
      `https://codeforces.com/api/user.status?handle=${handle}&from=1&count=1000`
    );
    const data = await response.json();
    if (data.status === 'OK') {
      return data.result.filter(
        sub =>
          sub.problem.contestId === contestId &&
          sub.problem.index === problemIndex
      );
    }
  } catch {
    return [];
  }
  return [];
};

// Fetch user info (rating, maxRating)
const fetchUserInfo = async (handle) => {
  try {
    const response = await fetch(
      `https://codeforces.com/api/user.info?handles=${handle}`
    );
    const data = await response.json();
    if (data.status === 'OK') {
      return data.result[0];
    }
  } catch {
    return null;
  }
};

const RatingResultPage = () => {
  const [problemLink, setProblemLink] = useState('');
  const [problemDetails, setProblemDetails] = useState(null);
  const [contestDetails, setContestDetails] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [submissionTime, setSubmissionTime] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [allSubs, setAllSubs] = useState([]);
  const [usedHint, setUsedHint] = useState(false);
  const [rows, setRows] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  const intervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Read handle from localStorage
  const handle = localStorage.getItem('cfHandle') || '';

  // Use handle-specific key for solvedHistory
  const solvedHistoryKey = `cf_solvedHistory_${handle}`;

  // Chart state with per-user persistence
  const [solvedHistory, setSolvedHistory] = useState(() => {
    const stored = localStorage.getItem(solvedHistoryKey);
    return stored ? JSON.parse(stored) : [];
  });

  // Save solvedHistory to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(solvedHistoryKey, JSON.stringify(solvedHistory));
  }, [solvedHistory, solvedHistoryKey]);

  // When handle changes, load that user's history
  useEffect(() => {
    const stored = localStorage.getItem(solvedHistoryKey);
    setSolvedHistory(stored ? JSON.parse(stored) : []);
    // eslint-disable-next-line
  }, [handle]);

  // Fetch user info once
  useEffect(() => {
    if (handle) {
      fetchUserInfo(handle).then(setUserInfo);
    }
  }, [handle]);

  // Fetch problem and contest details when problemLink changes
  useEffect(() => {
    const fetchDetails = async () => {
      if (!problemLink) {
        setProblemDetails(null);
        setContestDetails(null);
        setRows([]);
        return;
      }
      const details = extractProblemDetails(problemLink);
      if (!details) {
        setProblemDetails(null);
        setContestDetails(null);
        setRows([]);
        return;
      }
      const [{ problem, rows }, contestInfo] = await Promise.all([
        fetchProblemInfo(details.contestId, details.problemIndex),
        fetchContestInfo(details.contestId),
      ]);
      setProblemDetails(problem);
      setContestDetails(contestInfo);
      setRows(rows);
    };
    fetchDetails();
  }, [problemLink]);

  // Timer effect
  useEffect(() => {
    if (timerActive) {
      timerIntervalRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [timerActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Infer division from contest name (simple heuristic)
  const getDivision = (name) => {
    if (!name) return 'Unknown';
    if (name.toLowerCase().includes('div. 1') || name.toLowerCase().includes('division 1')) return 'Div. 1';
    if (name.toLowerCase().includes('div. 2') || name.toLowerCase().includes('division 2')) return 'Div. 2';
    if (name.toLowerCase().includes('div. 3') || name.toLowerCase().includes('division 3')) return 'Div. 3';
    return 'Unknown';
  };

  // Format contest start date nicely
  const formatDate = (unixSeconds) => {
    if (!unixSeconds) return 'Unknown';
    const date = new Date(unixSeconds * 1000);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Calculate expected time for a problem rating
  const getExpectedTime = (rating) => {
    if (!rating) return 1800;
    if (rating <= 800) return 300;
    if (rating <= 1200) return 600;
    if (rating <= 1600) return 1200;
    if (rating <= 2000) return 1800;
    if (rating <= 2400) return 2700;
    return 3600;
  };

  const handleStart = async () => {
    if (!handle) {
      setErrorMessage('No Codeforces handle found. Please enter your handle on the Home Page.');
      return;
    }
    if (!problemLink) {
      setErrorMessage('Please enter a Codeforces problem link.');
      return;
    }
    if (!problemDetails) {
      setErrorMessage('Invalid or unsupported problem link.');
      return;
    }

    setCheckingStatus(true);
    setErrorMessage('');
    setSubmissionTime(null);
    setTimer(0);
    setTimerActive(true);

    const details = extractProblemDetails(problemLink);
    // Fetch all submissions for attempts/first try
    const submissions = await fetchAllSubmissions(handle, details.contestId, details.problemIndex);
    setAllSubs(submissions);

    const start = Math.floor(Date.now() / 1000);

    intervalRef.current = setInterval(async () => {
      try {
        // Refresh submissions every check
        const updatedSubs = await fetchAllSubmissions(handle, details.contestId, details.problemIndex);
        setAllSubs(updatedSubs);
        const acceptedSub = updatedSubs.find(sub => sub.verdict === 'OK');
        if (acceptedSub) {
          clearInterval(intervalRef.current);
          setTimerActive(false);
          const solveTime = acceptedSub.creationTimeSeconds - start;
          setSubmissionTime(solveTime);
          setCheckingStatus(false);
        }
      } catch {
        clearInterval(intervalRef.current);
        setTimerActive(false);
        setErrorMessage('Error checking submission status.');
        setCheckingStatus(false);
      }
    }, 10000);
  };

  const handleReset = () => {
    setProblemLink('');
    setProblemDetails(null);
    setContestDetails(null);
    setErrorMessage('');
    setSubmissionTime(null);
    setCheckingStatus(false);
    setTimer(0);
    setTimerActive(false);
    setAllSubs([]);
    setUsedHint(false);
  };

  // Metrics
  const attempts = allSubs.length;
  const firstTrySuccess = allSubs.length > 0 && allSubs[0].verdict === 'OK';
  const isContest = !!(contestDetails && contestDetails.phase === 'FINISHED');
  const tags = problemDetails?.tags || [];

  // Calculate relative time
  const expectedTime = getExpectedTime(problemDetails?.rating);
  const relativeSolveTime = submissionTime !== null ? (submissionTime / expectedTime).toFixed(2) : null;

  // Problem stats from standings
  let numSolved = 0, numTried = 0;
  if (rows && problemDetails) {
    rows.forEach(row => {
      const probResult = row.problemResults[problemDetails.index.charCodeAt(0) - 'A'.charCodeAt(0)];
      if (probResult) {
        if (probResult.points > 0) numSolved++;
        if (probResult.rejectedAttemptCount > 0 || probResult.points > 0) numTried++;
      }
    });
  }
  const successRate = numTried > 0 ? ((numSolved / numTried) * 100).toFixed(2) : null;

  // User rating
  const userRating = userInfo?.rating;
  const userMaxRating = userInfo?.maxRating;

  // Use your estimator!
  const estimatedRating = submissionTime !== null && problemDetails
    ? estimateRating({
        problemRating: problemDetails.rating,
        solveTimeSec: submissionTime,
        attempts,
        usedHint,
        firstTrySuccess,
        tags,
        isContest,
        userRating,
        numSolved,
        numTried
      })
    : null;

  // Wrong submissions (verdict !== OK)
  const wrongSubs = allSubs.filter(sub => sub.verdict !== 'OK');

  // Add to solvedHistory whenever a question is solved
  useEffect(() => {
    if (
      submissionTime !== null &&
      problemDetails?.rating &&
      estimatedRating !== null
    ) {
      setSolvedHistory(prev => [
        ...prev,
        {
          original: problemDetails.rating,
          estimated: estimatedRating,
        }
      ]);
    }
    // eslint-disable-next-line
  }, [submissionTime]);

  // Chart data
  const chartData = {
    labels: solvedHistory.map((_, idx) => `Q${idx + 1}`),
    datasets: [
      {
        label: 'Original Rating',
        data: solvedHistory.map(q => q.original),
        borderColor: '#FF6B6B',
        backgroundColor: '#FF6B6B33',
        tension: 0.3,
        pointRadius: 5,
      },
      {
        label: 'Solved As',
        data: solvedHistory.map(q => q.estimated),
        borderColor: '#4ECDC4',
        backgroundColor: '#4ECDC433',
        tension: 0.3,
        pointRadius: 5,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' }
    },
    scales: {
      x: { title: { display: true, text: 'Number of Questions Solved' } },
      y: { 
        title: { display: true, text: 'Rating' },
        suggestedMin: Math.min(...solvedHistory.flatMap(q => [q.original, q.estimated]), 800) - 100,
        suggestedMax: Math.max(...solvedHistory.flatMap(q => [q.original, q.estimated]), 1200) + 100
      }
    }
  };

  return (
    <div className="result-container">
      <h1 className="title">Codeforces Performance Analyzer</h1>

      <div className="cf-id-display" style={{ marginBottom: 16 }}>
        <strong>Your Codeforces ID:</strong> <span>{handle || 'Not set'}</span>
        {userInfo && (
          <span style={{ marginLeft: 16 }}>
            <strong>Current Rating:</strong> {userInfo.rating} | <strong>Max Rating:</strong> {userInfo.maxRating}
          </span>
        )}
      </div>

      <div className="input-group">
        <input
          type="url"
          placeholder="Enter Codeforces Problem Link"
          value={problemLink}
          onChange={(e) => setProblemLink(e.target.value)}
          disabled={checkingStatus}
        />
        <button
          onClick={handleStart}
          disabled={checkingStatus || !handle || !problemLink || !problemDetails}
        >
          {checkingStatus ? 'Checking Submissions...' : 'Start Analysis'}
        </button>
        {submissionTime !== null && (
          <button onClick={handleReset} style={{ marginLeft: 8 }}>
            Analyze Another
          </button>
        )}
      </div>

      {/* Display problem rating */}
      {problemDetails?.rating && (
        <div className="problem-rating" style={{ marginTop: 12, fontWeight: 'bold' }}>
          Problem Rating: <span>{problemDetails.rating}</span>
        </div>
      )}

      {/* Display contest date */}
      {contestDetails?.startTimeSeconds && (
        <div className="contest-date" style={{ marginTop: 8 }}>
          Contest Date: <span>{formatDate(contestDetails.startTimeSeconds)}</span>
        </div>
      )}

      {/* Display division */}
      {contestDetails?.name && (
        <div className="contest-division" style={{ marginTop: 8 }}>
          Division: <span>{getDivision(contestDetails.name)}</span>
        </div>
      )}

      {/* Show tags */}
      {tags.length > 0 && (
        <div className="problem-tags" style={{ marginTop: 8 }}>
          Tags: {tags.join(', ')}
        </div>
      )}

      {/* Show timer if active */}
      {timerActive && (
        <div className="timer" style={{ marginTop: 12 }}>
          <strong>Timer:</strong> {Math.floor(timer / 60)}m {timer % 60}s
        </div>
      )}

      {/* Used hint checkbox */}
      <div style={{ marginTop: 8 }}>
        <label>
          <input
            type="checkbox"
            checked={usedHint}
            onChange={e => setUsedHint(e.target.checked)}
            disabled={checkingStatus}
          />
          Used Hint
        </label>
      </div>

      {/* Problem statistics */}
      {(numSolved || numTried) && (
        <div className="problem-stats" style={{ marginTop: 12 }}>
          <p>Number of Solvers: <strong>{numSolved}</strong></p>
          <p>Number of Users Attempted: <strong>{numTried}</strong></p>
          <p>Success Rate: <strong>{successRate}%</strong></p>
        </div>
      )}

      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {/* Show wrong submissions */}
      {wrongSubs.length > 0 && (
        <div className="wrong-subs" style={{ marginTop: 16 }}>
          <strong>Wrong Submissions:</strong>
          <table className="wrong-subs-table" style={{ marginTop: 8, width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Verdict</th>
                <th>Time</th>
                <th>Language</th>
              </tr>
            </thead>
            <tbody>
              {wrongSubs.map((sub, idx) => (
                <tr key={sub.id || idx}>
                  <td>{idx + 1}</td>
                  <td>{sub.verdict}</td>
                  <td>{new Date(sub.creationTimeSeconds * 1000).toLocaleTimeString()}</td>
                  <td>{sub.programmingLanguage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {submissionTime !== null && (
        <div className="result-display">
          <h2 className="rating">
            Estimated Performance Rating: {estimatedRating}
          </h2>
          <p>
            Time to solve: {Math.floor(submissionTime / 60)}m {submissionTime % 60}s
          </p>
          <p>Relative Solve Time: {relativeSolveTime}x expected</p>
          <p>Attempts: {allSubs.length}</p>
          <p>First Try Success: {firstTrySuccess ? 'Yes' : 'No'}</p>
          <p>In Contest: {isContest ? 'Yes' : 'No'}</p>
          <p>Your Rating: {userRating}</p>
          <p>Problem vs Your Rating: {problemDetails?.rating && userRating ? (problemDetails.rating - userRating) : 'N/A'}</p>
        </div>
      )}

      {/* --- CHART --- */}
      {solvedHistory.length > 0 && (
        <div className="chart-container" style={{ marginTop: 32, marginBottom: 32 }}>
          <h3>Progress Chart</h3>
          <Line data={chartData} options={chartOptions} height={350} />
        </div>
      )}
    </div>
  );
};

export default RatingResultPage;
