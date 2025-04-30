import React, { useState, useRef, useEffect } from 'react';
import './RatingResultPage.css';

// Helper to extract problem details from URL
const extractProblemDetails = (url) => {
  const regex1 = /codeforces\.com\/problemset\/problem\/(\d+)\/([A-Za-z0-9]+)/;
  const regex2 = /codeforces\.com\/contest\/(\d+)\/problem\/([A-Za-z0-9]+)/;
  let match = url.match(regex1) || url.match(regex2);
  return match ? { contestId: Number(match[1]), problemIndex: match[2] } : null;
};

// Fetch problem info for rating
const fetchProblemInfo = async (contestId, problemIndex) => {
  try {
    const response = await fetch(
      `https://codeforces.com/api/contest.standings?contestId=${contestId}&from=1&count=1`
    );
    const data = await response.json();
    if (data.status === 'OK') {
      return data.result.problems.find(p => p.index === problemIndex) || null;
    }
  } catch {
    return null;
  }
};

// Fetch user's accepted submission for the problem
const checkProblemAccepted = async (handle, contestId, problemIndex) => {
  try {
    const response = await fetch(
      `https://codeforces.com/api/user.status?handle=${handle}&from=1&count=50`
    );
    const data = await response.json();
    if (data.status === 'OK') {
      return data.result.find(sub =>
        sub.problem.contestId === contestId &&
        sub.problem.index === problemIndex &&
        sub.verdict === 'OK'
      );
    }
  } catch {
    return null;
  }
};

const RatingResultPage = () => {
  const [problemLink, setProblemLink] = useState('');
  const [problemDetails, setProblemDetails] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [submissionTime, setSubmissionTime] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const intervalRef = useRef(null);

  // Read handle from localStorage
  const handle = localStorage.getItem('cfHandle') || '';

  // Rating calculation (you can replace with your estimator)
  const calculateRating = (solveTime) => {
    const baseRating = 1500;
    let rating = baseRating;
    if (solveTime < 900) rating += 200;
    else if (solveTime < 1800) rating += 100;
    else rating -= 50;
    if (problemDetails?.rating) {
      rating += (problemDetails.rating - 1500) * 0.3;
    }
    return Math.max(800, Math.min(3000, Math.round(rating)));
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

    const details = extractProblemDetails(problemLink);
    if (!details) {
      setErrorMessage('Invalid Codeforces problem link.');
      return;
    }

    setCheckingStatus(true);
    setErrorMessage('');
    setSubmissionTime(null);

    const problemInfo = await fetchProblemInfo(details.contestId, details.problemIndex);
    setProblemDetails(problemInfo);

    const start = Math.floor(Date.now() / 1000);

    intervalRef.current = setInterval(async () => {
      try {
        const acceptedSub = await checkProblemAccepted(handle, details.contestId, details.problemIndex);
        if (acceptedSub) {
          clearInterval(intervalRef.current);
          const solveTime = acceptedSub.creationTimeSeconds - start;
          setSubmissionTime(solveTime);
          setCheckingStatus(false);
        }
      } catch {
        clearInterval(intervalRef.current);
        setErrorMessage('Error checking submission status.');
        setCheckingStatus(false);
      }
    }, 10000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleReset = () => {
    setProblemLink('');
    setProblemDetails(null);
    setErrorMessage('');
    setSubmissionTime(null);
    setCheckingStatus(false);
  };

  return (
    <div className="result-container">
      <h1 className="title">Codeforces Performance Analyzer</h1>

      <div className="cf-id-display" style={{ marginBottom: 16 }}>
        <strong>Your Codeforces ID:</strong> <span>{handle || 'Not set'}</span>
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
          disabled={checkingStatus || !handle || !problemLink}
        >
          {checkingStatus ? 'Checking Submissions...' : 'Start Analysis'}
        </button>
        {submissionTime !== null && (
          <button onClick={handleReset} style={{ marginLeft: 8 }}>
            Analyze Another
          </button>
        )}
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {submissionTime !== null && (
        <div className="result-display">
          <h2 className="rating">
            Estimated Performance Rating: {calculateRating(submissionTime)}
          </h2>
          <p>
            Time to solve: {Math.floor(submissionTime / 60)}m {submissionTime % 60}s
          </p>
          {problemDetails?.rating && (
            <p>Problem Rating: {problemDetails.rating}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default RatingResultPage;
