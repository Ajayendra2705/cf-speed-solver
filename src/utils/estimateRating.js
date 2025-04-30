// src/utils/estimateRating.js
export function estimateRating({
    problemRating,
    solveTimeSec,
    attempts,
    usedHint,
    firstTrySuccess,
    tags,
    isContest,
  }) {
    let estimated = problemRating;
  
    const expectedTimes = {
      800: 300,
      1200: 600,
      1600: 1200,
      2000: 1800,
      2400: 2700,
    };
  
    const expectedTime = expectedTimes[problemRating] || 1800;
    const timeRatio = solveTimeSec / expectedTime;
  
    if (timeRatio < 0.6) estimated += 200;
    else if (timeRatio < 1.0) estimated += 100;
    else if (timeRatio > 1.5) estimated -= 100;
    else if (timeRatio > 2.0) estimated -= 200;
  
    if (firstTrySuccess) estimated += 50;
    if (attempts === 2) estimated -= 50;
    if (attempts >= 3) estimated -= 100;
  
    if (usedHint) estimated -= 150;
    if (isContest) estimated += 50;
  
    const hardTags = ['dp', 'math', 'data structures', 'constructive algorithms'];
    const softTags = ['implementation', 'greedy', 'brute force'];
  
    let tagScore = 0;
    tags.forEach(tag => {
      if (hardTags.includes(tag)) tagScore += 25;
      if (softTags.includes(tag)) tagScore -= 10;
    });
    estimated += tagScore;
  
    estimated = Math.max(800, Math.min(estimated, 3500));
    return Math.round(estimated);
  }
  