/**
 * Advanced NLP & Phonetic Food Matching Engine
 * Handles misspellings, phonetic variants (e.g. chila / chella / chilla / cheela, daal / dal / dhal),
 * Levenshtein distance, and fuzzy token matching.
 */

export interface LoggedMealCandidate {
  id: string;
  foodName: string;
  mealType: string;
  calories?: number;
  protein?: number;
  quantity?: number;
  quantityUnit?: string;
}

export interface FoodNLPMatchResult {
  bestMatch: LoggedMealCandidate | null;
  confidence: number;
  suggestions: LoggedMealCandidate[];
}

export class FoodNLP {
  /**
   * Phonetically normalizes food names for culinary match comparison
   */
  public static normalizePhonetic(str: string): string {
    if (!str) return "";
    let s = str.toLowerCase().trim();

    // Remove punctuation
    s = s.replace(/[^a-z0-9\s]/g, " ");

    // Common phonetic vowel and diphthong standardizations
    s = s.replace(/ee+/g, "i");
    s = s.replace(/ea+/g, "i");
    s = s.replace(/oo+/g, "u");
    s = s.replace(/ou+/g, "u");
    s = s.replace(/ai+/g, "e");
    s = s.replace(/ay+/g, "e");

    // Common Indian culinary consonant variations
    s = s.replace(/chh+/g, "ch");
    s = s.replace(/dh+/g, "d");
    s = s.replace(/bh+/g, "b");
    s = s.replace(/th+/g, "t");
    s = s.replace(/ph+/g, "f");
    s = s.replace(/kh+/g, "k");
    s = s.replace(/gh+/g, "g");
    s = s.replace(/sh+/g, "s");

    // Collapse double letters (e.g. "chilla" -> "chila", "chella" -> "chela", "rotti" -> "roti")
    s = s.replace(/(.)\1+/g, "$1");

    // Collapse whitespace
    s = s.replace(/\s+/g, " ").trim();

    return s;
  }

  /**
   * Computes standard Levenshtein edit distance between two strings
   */
  public static levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Computes similarity ratio between 0.0 (no match) and 1.0 (exact match)
   */
  public static similarityScore(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;

    const norm1 = this.normalizePhonetic(s1);
    const norm2 = this.normalizePhonetic(s2);

    if (norm1 === norm2) return 0.95;
    if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.88;

    // Word token overlap
    const tokens1 = norm1.split(/\s+/).filter((t) => t.length > 1);
    const tokens2 = norm2.split(/\s+/).filter((t) => t.length > 1);

    const commonTokens = tokens1.filter((t1) =>
      tokens2.some((t2) => t1 === t2 || this.levenshteinDistance(t1, t2) <= 1)
    );

    if (commonTokens.length > 0) {
      const tokenRatio = (commonTokens.length * 2) / (tokens1.length + tokens2.length);
      return Math.max(0.65, tokenRatio);
    }

    // Whole string edit distance ratio
    const maxLen = Math.max(norm1.length, norm2.length);
    if (maxLen === 0) return 1.0;

    const dist = this.levenshteinDistance(norm1, norm2);
    const score = 1 - dist / maxLen;

    return Math.max(0, score);
  }

  /**
   * Searches an array of logged meals for the best match using NLP phonetic similarity
   */
  public static findBestMatch(
    queryName: string,
    candidates: LoggedMealCandidate[],
    targetMealType?: string
  ): FoodNLPMatchResult {
    if (!candidates || candidates.length === 0) {
      return { bestMatch: null, confidence: 0, suggestions: [] };
    }

    const filteredCandidates = targetMealType
      ? candidates.filter((c) => c.mealType.toUpperCase() === targetMealType.toUpperCase())
      : candidates;

    const searchPool = filteredCandidates.length > 0 ? filteredCandidates : candidates;

    const scored = searchPool.map((candidate) => ({
      candidate,
      score: this.similarityScore(queryName, candidate.foodName),
    }));

    scored.sort((a, b) => b.score - a.score);

    const top = scored[0];

    // High confidence threshold (>= 0.50 or if there is only 1 candidate in the pool)
    if (top && (top.score >= 0.50 || searchPool.length === 1)) {
      return {
        bestMatch: top.candidate,
        confidence: top.score,
        suggestions: scored.slice(1, 4).map((s) => s.candidate),
      };
    }

    return {
      bestMatch: null,
      confidence: top ? top.score : 0,
      suggestions: searchPool.slice(0, 4),
    };
  }
}
