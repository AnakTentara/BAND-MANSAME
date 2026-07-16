export function getDiceCoefficient(s1, s2) {
  const str1 = s1.toLowerCase().replace(/\s+/g, '');
  const str2 = s2.toLowerCase().replace(/\s+/g, '');
  if (str1 === str2) return 1.0;
  if (str1.length < 2 || str2.length < 2) return 0;
  
  const bigrams1 = new Set();
  for (let i = 0; i < str1.length - 1; i++) {
    bigrams1.add(str1.substring(i, i + 2));
  }
  
  let intersection = 0;
  const bigrams2 = new Set();
  for (let i = 0; i < str2.length - 1; i++) {
    const bigram = str2.substring(i, i + 2);
    if (bigrams1.has(bigram)) {
      intersection++;
    }
    bigrams2.add(bigram);
  }
  
  return (2.0 * intersection) / (bigrams1.size + bigrams2.size);
}

export function findSimilarCandidates(query, candidates) {
  const qLower = query.toLowerCase().trim();
  const qWords = qLower.split(/\s+/);
  
  const results = candidates.map(candidate => {
    const cName = candidate.name.toLowerCase().trim();
    const cWords = cName.split(/\s+/);
    
    // 1. Exact match check
    if (cName === qLower) {
      return { candidate, score: 1.0, exact: true };
    }
    
    // 2. Substring match check
    if (cName.includes(qLower) || qLower.includes(cName)) {
      // Calculate how close they are in length to scale the score
      const lengthRatio = Math.min(qLower.length, cName.length) / Math.max(qLower.length, cName.length);
      const score = 0.8 + (lengthRatio * 0.15); // ranges from 0.8 to 0.95
      return { candidate, score, exact: false };
    }
    
    // 3. Word containment check
    let wordMatchCount = 0;
    for (const qw of qWords) {
      if (cWords.some(cw => cw.includes(qw) || qw.includes(cw))) {
        wordMatchCount++;
      }
    }
    const wordScore = qWords.length > 0 ? wordMatchCount / qWords.length : 0;
    
    // 4. Bigram similarity check (handles typos)
    const diceScore = getDiceCoefficient(qLower, cName);
    
    // Combine scores
    const finalScore = Math.max(wordScore * 0.8, diceScore);
    
    return { candidate, score: finalScore, exact: false };
  });
  
  // Filter matches: score must be at least 0.35
  return results
    .filter(r => r.score >= 0.35)
    .sort((a, b) => b.score - a.score);
}
