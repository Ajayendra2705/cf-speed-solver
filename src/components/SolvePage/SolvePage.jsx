import React, { useEffect, useState } from "react";
import './SolvePage.css';

const SolvePage = () => {
  const [questions, setQuestions] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [sortBySolvedCount, setSortBySolvedCount] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [error, setError] = useState(null);

  const handle = localStorage.getItem("cfHandle");

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
                tags: problem.tags || []
              };
            });

            setQuestions(merged);

            // Extract all unique tags
            const tagsSet = new Set();
            merged.forEach(q => (q.tags || []).forEach(tag => tagsSet.add(tag)));
            setAllTags(Array.from(tagsSet).sort());
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

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearTags = () => setSelectedTags([]);

  // Filtering logic
  let filteredQuestions = questions.filter(problem => {
    if (!problem.rating) return false;
    const ratingMatch = selectedRatings.length === 0 || selectedRatings.includes(problem.rating);
    const tagMatch = selectedTags.length === 0 || selectedTags.every(tag => problem.tags.includes(tag));
    return ratingMatch && tagMatch;
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
          
          <div className="filter-card">
            <div className="handle-row">
              <span className="handle-icon" title="Your Codeforces Handle">👤</span>
              <span className="handle-info">
                Logged in as: <strong>{handle}</strong>
              </span>
            </div>
            <div className="filters-row">
              <div className="filters-title">Filter by Rating</div>
              <button onClick={clearRatings} className="clear-button">
                Clear Rating Filters
              </button>
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
              <div className="filters-title" style={{marginTop: "1.2rem"}}>Filter by Topic</div>
              <button onClick={clearTags} className="clear-button">
                Clear Topic Filters
              </button>
              <div className="tag-filter-buttons">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    className={`tag-filter-button ${selectedTags.includes(tag) ? "selected" : ""}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
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
                    <th>Tags</th>
                    <th
                      onClick={() =>
                        setSortBySolvedCount((prev) => (prev === "desc" ? "asc" : "desc"))
                      }
                      className="sortable-column solved-by-column"
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
                          <td>
                            <div className="tag-badges">
                              {problem.tags.length > 0
                                ? problem.tags.map((tag, idx) => (
                                    <span key={idx} className="tag-badge" title={tag}>
                                      {tag}
                                    </span>
                                  ))
                                : <span className="no-tags">-</span>
                              }
                            </div>
                          </td>
                          <td>{problem.solvedCount.toLocaleString()}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="no-results">
                        No problems found with selected filters.
                      </td>
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
