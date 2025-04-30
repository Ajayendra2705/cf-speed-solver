import React, { useEffect, useState } from "react";
import './SolvePage.css';

const SolvePage = () => {
  const [questions, setQuestions] = useState([]);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [sortBySolvedCount, setSortBySolvedCount] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [error, setError] = useState(null);

  // Retrieve the handle from localStorage
  const handle = localStorage.getItem("cfHandle"); // Get the handle from localStorage

  useEffect(() => {
    if (handle) {
      setIsLoggedIn(true);

      // Fetching questions and problem statistics
      const fetchQuestions = async () => {
        try {
          const res = await fetch("https://codeforces.com/api/problemset.problems");
          const data = await res.json();

          if (data.status === "OK") {
            const problems = data.result.problems;
            const stats = data.result.problemStatistics;

            const merged = problems.map((problem) => {
              const stat = stats.find(
                (s) => s.contestId === problem.contestId && s.index === problem.index
              );
              return {
                ...problem,
                solvedCount: stat ? stat.solvedCount : 0,
              };
            });

            setQuestions(merged);
          } else {
            setError("Error fetching problemset.");
          }
        } catch (err) {
          setError("Error fetching questions.");
        } finally {
          setLoadingQuestions(false);
        }
      };
      fetchQuestions();

      // Fetching user submissions
      const fetchSubmissions = async () => {
        try {
          const res = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
          const data = await res.json();

          if (data.status === "OK") {
            setSubmissions(data.result);
          } else {
            setError("Error fetching submissions.");
          }
        } catch (err) {
          setError("Error fetching submissions.");
        } finally {
          setLoadingSubmissions(false);
        }
      };
      fetchSubmissions();
    } else {
      setError("No handle found. Please enter your handle on the Home Page.");
    }
  }, [handle]);

  const getProblemStatus = (problem) => {
    const matches = submissions.filter(
      (sub) => sub.problem.contestId === problem.contestId && sub.problem.index === problem.index
    );
    const hasAccepted = matches.some((sub) => sub.verdict === "OK");
    const hasAttempted = matches.length > 0;
    return hasAccepted ? "Solved" : hasAttempted ? "Wrong" : "Unsolved";
  };

  const toggleRating = (rating) => {
    setSelectedRatings((prev) =>
      prev.includes(rating) ? prev.filter((r) => r !== rating) : [...prev, rating]
    );
  };

  const clearRatings = () => setSelectedRatings([]);

  let filteredQuestions = questions.filter((problem) => {
    if (!problem.rating) return false;
    return selectedRatings.length === 0 || selectedRatings.includes(problem.rating);
  });

  if (sortBySolvedCount === "desc") {
    filteredQuestions.sort((a, b) => b.solvedCount - a.solvedCount);
  } else if (sortBySolvedCount === "asc") {
    filteredQuestions.sort((a, b) => a.solvedCount - b.solvedCount);
  }

  return (
    <div className="solve-page">
      {isLoggedIn ? (
        <>
          <h2 className="page-heading">Solve Problems</h2>
          <p className="handle-info">Logged in as: <strong>{handle}</strong></p>

          <div className="filter-buttons">
            <button onClick={clearRatings} className="clear-button">Clear Filters</button>
            <div className="rating-buttons">
              {[...Array(28)].map((_, i) => {
                const rating = 800 + i * 100;
                return (
                  <button
                    key={rating}
                    onClick={() => toggleRating(rating)}
                    className={`rating-button ${selectedRatings.includes(rating) ? "selected" : ""}`}
                  >
                    {rating}
                  </button>
                );
              })}
            </div>
          </div>

          {loadingQuestions || loadingSubmissions ? (
            <p className="loading-text">Loading...</p>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : (
            <div className="table-container">
              <table className="problems-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Rating</th>
                    <th>Contest + Index</th>
                    <th
                      onClick={() =>
                        setSortBySolvedCount((prev) => (prev === "desc" ? "asc" : "desc"))
                      }
                      className="sortable-column"
                    >
                      Solved By {sortBySolvedCount === "desc" ? "🔽" : sortBySolvedCount === "asc" ? "🔼" : ""}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.length > 0 ? (
                    filteredQuestions.map((problem, index) => {
                      const status = getProblemStatus(problem);
                      let rowClass = "unsolved-row";
                      if (status === "Solved") rowClass = "solved-row";
                      else if (status === "Wrong") rowClass = "wrong-row";

                      return (
                        <tr key={index} className={`problem-row ${rowClass}`}>
                          <td>
                            <a
                              href={`https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}`}
                              target="_blank"
                              rel="noreferrer"
                              className="problem-link"
                            >
                              {problem.name}
                            </a>
                          </td>
                          <td>{problem.rating}</td>
                          <td>{problem.contestId}{problem.index}</td>
                          <td>{problem.solvedCount}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="no-results">No problems found with selected filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <p className="loading-text">Loading...</p>
      )}
    </div>
  );
};

export default SolvePage;
