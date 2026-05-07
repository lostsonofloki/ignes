const toNonNegativeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export const rankRecommendationsByProviderAffinity = ({
  recommendations = [],
  tmdbResults = [],
  providerResults = [],
  selectedProviderIds = [],
}) => {
  const hasProviderPreferences = Array.isArray(selectedProviderIds) && selectedProviderIds.length > 0;
  const totalRecommendations = Math.min(
    recommendations.length,
    tmdbResults.length,
    providerResults.length,
  );

  if (!hasProviderPreferences || totalRecommendations === 0) {
    return {
      recommendations,
      tmdbResults,
      providerResults,
      rankingMetrics: {
        hasProviderPreferences,
        totalRecommendations,
        matchedRecommendationCount: 0,
        unmatchedRecommendationCount: totalRecommendations,
        filteredOutCount: 0,
        reorderedCount: 0,
        promotedFirstItem: false,
      },
    };
  }

  const combined = recommendations.map((rec, index) => {
    const tmdb = tmdbResults[index] || null;
    const providers = providerResults[index] || null;
    const providerLogos = Array.isArray(tmdb?.provider_logos) ? tmdb.provider_logos : [];
    const providerMatchScore = providerLogos.length;
    const hasProviderMatch = providerMatchScore > 0;
    return {
      index,
      rec,
      tmdb,
      providers,
      hasProviderMatch,
      providerMatchScore,
      voteAverage: toNonNegativeNumber(tmdb?.vote_average),
      voteCount: toNonNegativeNumber(tmdb?.vote_count),
    };
  });

  const originalFirstIndex = combined[0]?.index ?? -1;
  const sorted = [...combined].sort((a, b) => {
    if (Number(b.hasProviderMatch) !== Number(a.hasProviderMatch)) {
      return Number(b.hasProviderMatch) - Number(a.hasProviderMatch);
    }
    if (b.providerMatchScore !== a.providerMatchScore) {
      return b.providerMatchScore - a.providerMatchScore;
    }
    if (b.voteAverage !== a.voteAverage) {
      return b.voteAverage - a.voteAverage;
    }
    if (b.voteCount !== a.voteCount) {
      return b.voteCount - a.voteCount;
    }
    return a.index - b.index;
  });

  const reorderedCount = sorted.reduce(
    (count, item, idx) => (item.index !== idx ? count + 1 : count),
    0,
  );
  const matchedRecommendationCount = sorted.filter((item) => item.hasProviderMatch).length;
  const unmatchedRecommendationCount = Math.max(0, sorted.length - matchedRecommendationCount);
  const filteredOutCount = unmatchedRecommendationCount;

  return {
    recommendations: sorted.map((item) => item.rec),
    tmdbResults: sorted.map((item) => item.tmdb),
    providerResults: sorted.map((item) => item.providers),
    rankingMetrics: {
      hasProviderPreferences,
      totalRecommendations: sorted.length,
      matchedRecommendationCount,
      unmatchedRecommendationCount,
      filteredOutCount,
      reorderedCount,
      promotedFirstItem:
        matchedRecommendationCount > 0 && sorted[0]?.index !== originalFirstIndex,
    },
  };
};

