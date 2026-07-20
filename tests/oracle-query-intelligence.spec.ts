import { test, expect } from "@playwright/test";
import { parseOracleQueryConstraints } from "../src/utils/naturalLanguageSort";
import {
  LOW_RATING_THRESHOLD,
  buildTasteContextString,
  buildUserTasteProfile,
} from "../src/utils/oracleTasteProfile";
import { resolveOracleQueryConstraints } from "../src/utils/oracleQueryConstraints";
import {
  ensureOracleRecommendationShape,
  getOracleFailureBucket,
  isAbortLikeError,
  shouldRetryOracleError,
} from "../src/utils/oracleReliability";
import { buildOracleEventPayload } from "../src/utils/oracleAnalytics";
import { rankRecommendationsByProviderAffinity } from "../src/utils/oracleRanking";

test("Oracle query parser maps compound prompt constraints", async () => {
  const parsed = parseOracleQueryConstraints("pre-1960 horror on my watchlist");

  expect(parsed.hasConstraints).toBeTruthy();
  expect(parsed.watchStatus).toBe("to-watch");
  expect(parsed.yearMax).toBe(1959);
  expect(parsed.genreIds).toContain(27);
  expect(parsed.genreNames).toContain("horror");
});

test("Oracle query parser maps between-year constraints", async () => {
  const parsed = parseOracleQueryConstraints("between 1980 and 1990 thriller movies");

  expect(parsed.hasConstraints).toBeTruthy();
  expect(parsed.yearMin).toBe(1980);
  expect(parsed.yearMax).toBe(1990);
  expect(parsed.genreNames).toContain("thriller");
});

test("Oracle taste profile includes weighted sections and rating polarity buckets", async () => {
  const logs = [
    {
      title: "Recent Favorite",
      watch_status: "watched",
      rating: 4.8,
      moods: ["moody"],
      genres: ["drama"],
      year: 2021,
      created_at: new Date().toISOString(),
    },
    {
      title: "Old Favorite",
      watch_status: "watched",
      rating: 4.4,
      moods: ["moody"],
      genres: ["drama"],
      year: 2018,
      created_at: "2024-01-01T00:00:00.000Z",
    },
    {
      title: "Avoid Candidate",
      watch_status: "watched",
      rating: LOW_RATING_THRESHOLD,
      moods: ["grim"],
      genres: ["horror"],
      year: 2016,
      created_at: new Date().toISOString(),
    },
  ];
  const recentToWatch = [{ title: "Next Up", created_at: new Date().toISOString() }];
  const listItems = [{ title: "Curated Pick" }];

  const profile = buildUserTasteProfile(logs, recentToWatch, listItems);
  const context = buildTasteContextString(profile);

  expect(profile.weightedSignals.moods[0].label).toBe("moody");
  expect(profile.weightedSignals.genres[0].label).toBe("drama");
  expect(profile.ratingBuckets.liked).toContain("Recent Favorite");
  expect(profile.ratingBuckets.avoid).toContain("Avoid Candidate");
  expect(context).toContain("MoodAffinityWeighted:");
  expect(context).toContain("GenreAffinityWeighted:");
  expect(context).toContain("AvoidSimilarTo: Avoid Candidate");
});

test("Oracle taste context preserves avoid-like titles under deterministic capping", async () => {
  const logs = Array.from({ length: 40 }).map((_, index) => ({
    title: `Low Rated ${index + 1}`,
    watch_status: "watched",
    rating: 1.5,
    moods: ["tense"],
    genres: ["thriller"],
    year: 2000 + (index % 20),
    created_at: new Date(Date.now() - index * 1000 * 60).toISOString(),
  }));
  const profile = buildUserTasteProfile(logs, [], []);
  const context = buildTasteContextString(profile);

  const avoidLine = context
    .split("\n")
    .find((line) => line.startsWith("AvoidSimilarTo:"));
  expect(avoidLine).toBeTruthy();
  expect(avoidLine).not.toContain("none");
  expect((avoidLine?.split(",") || []).length).toBeLessThanOrEqual(10);
});

test("Oracle RPC-compatible payload keeps deterministic context line ordering", async () => {
  const rpcLikeProfile = {
    summary: {
      watchedCount: 120,
      recentWatchedCount: 12,
      avgRating: "3.94",
      topMoods: ["moody", "cozy"],
      topGenres: ["drama", "thriller"],
      topDecades: ["1990s", "2000s"],
    },
    weightedSignals: {
      moods: [{ label: "moody", score: 2.34, count: 3 }],
      genres: [{ label: "drama", score: 2.12, count: 3 }],
    },
    ratingBuckets: {
      liked: ["Liked 1", "Liked 2", "Liked 3"],
      avoid: ["Avoid 1", "Avoid 2"],
      neutral: ["Neutral 1"],
    },
    recentWatchedTitles: ["Recent 1", "Recent 2"],
    recentToWatchTitles: ["Watchlist 1"],
    curatedTitles: ["Curated 1", "Curated 2"],
  };

  const contextLines = buildTasteContextString(rpcLikeProfile).split("\n");
  expect(contextLines[0].startsWith("TasteStats:")).toBeTruthy();
  expect(contextLines[1].startsWith("TopMoods:")).toBeTruthy();
  expect(contextLines[2].startsWith("TopGenres:")).toBeTruthy();
  expect(contextLines[3].startsWith("MoodAffinityWeighted:")).toBeTruthy();
  expect(contextLines[4].startsWith("GenreAffinityWeighted:")).toBeTruthy();
  expect(contextLines[7].startsWith("AvoidSimilarTo:")).toBeTruthy();
});

test("Oracle constraint resolver falls back to deterministic parser if Groq parser fails", async () => {
  const constraints = await resolveOracleQueryConstraints("pre-1960 horror on my watchlist", {
    constraintsEnabled: true,
    groqIntentEnabled: true,
    groqIntentParser: async () => {
      throw new Error("Groq timeout");
    },
  });

  expect(constraints.watchStatus).toBe("to-watch");
  expect(constraints.yearMax).toBe(1959);
  expect(constraints.genreIds).toContain(27);
  expect(constraints.hasConstraints).toBeTruthy();
});

test("Oracle constraint resolver prefers Groq parser payload when valid", async () => {
  const constraints = await resolveOracleQueryConstraints("anything", {
    constraintsEnabled: true,
    groqIntentEnabled: true,
    groqIntentParser: async () => ({
      normalizedText: "anything",
      yearMin: 1980,
      yearMax: 1990,
      watchStatus: "watched",
      genreIds: [53],
      genreNames: ["thriller"],
      hasConstraints: true,
      strippedPrompt: "anything",
    }),
  });

  expect(constraints.watchStatus).toBe("watched");
  expect(constraints.yearMin).toBe(1980);
  expect(constraints.yearMax).toBe(1990);
  expect(constraints.genreIds).toEqual([53]);
});

test("Oracle reliability maps failure buckets deterministically", async () => {
  expect(getOracleFailureBucket(new Error("request timeout while fetching"))).toBe("timeout");
  expect(getOracleFailureBucket({ message: "Rate limit hit", status: 429 })).toBe("rate_limit");
  expect(getOracleFailureBucket(new Error("JSON parse failed"))).toBe("parse_fail");
  expect(getOracleFailureBucket({ message: "Upstream unavailable", status: 503 })).toBe("upstream_unavailable");
});

test("Oracle reliability retry policy skips 404 and retries transient failures", async () => {
  expect(shouldRetryOracleError({ status: 404, message: "model not found" })).toBeFalsy();
  expect(shouldRetryOracleError({ status: 429, message: "rate limited" })).toBeTruthy();
  expect(shouldRetryOracleError({ status: 500, message: "upstream failure" })).toBeTruthy();
  expect(shouldRetryOracleError({ message: "request timeout" })).toBeTruthy();
});

test("Oracle fallback payload normalizer guarantees UI-safe rationale and vibeCheck", async () => {
  const normalized = ensureOracleRecommendationShape([
    { title: "Fallback Title", year: "1999", rationale: "", vibeCheck: "" },
    { title: "  ", year: null },
  ]);
  expect(normalized).toHaveLength(1);
  expect(normalized[0].title).toBe("Fallback Title");
  expect(normalized[0].year).toBe(1999);
  expect(normalized[0].rationale.length).toBeGreaterThan(0);
  expect(normalized[0].vibeCheck.length).toBeGreaterThan(0);
});

test("Oracle abort detection catches abort-like errors", async () => {
  expect(isAbortLikeError({ name: "AbortError", message: "aborted" })).toBeTruthy();
  expect(isAbortLikeError({ message: "Request cancelled by reroll" })).toBeTruthy();
  expect(isAbortLikeError(new Error("Something else"))).toBeFalsy();
});

test("Oracle analytics payload maps expanded telemetry metrics", async () => {
  const payload = buildOracleEventPayload({
    userId: "00000000-0000-0000-0000-000000000001",
    meta: {
      provider: "openrouter",
      modelUsed: "google/gemini-2.0-flash-001",
      groqUsed: true,
      latency: "1420ms",
      qualityMetrics: {
        inputRecommendationCount: 7,
        postFilterRecommendationCount: 4,
        dedupeDroppedCount: 2,
        rejectedViolationAttemptCount: 1,
      },
      attemptMetrics: {
        providerAttemptCount: 2,
        fallbackDepth: 1,
        providerAttempts: [
          {
            provider: "gemini",
            model: "gemini-2.0-flash",
            result: "failure",
            status: "429",
            failure_bucket: "rate_limit",
            latency_ms: 500,
          },
          {
            provider: "openrouter",
            model: "google/gemini-2.0-flash-001",
            result: "success",
            status: "ok",
            failure_bucket: null,
            latency_ms: 920,
          },
        ],
      },
    },
    success: true,
    requestSource: "discover",
    promptType: "custom_prompt",
    recommendationCount: 4,
    tmdbHitCount: 4,
  });

  expect(payload.input_recommendation_count).toBe(7);
  expect(payload.post_filter_recommendation_count).toBe(4);
  expect(payload.dedupe_dropped_count).toBe(2);
  expect(payload.rejected_violation_attempt_count).toBe(1);
  expect(payload.provider_attempt_count).toBe(2);
  expect(payload.fallback_depth).toBe(1);
  expect(payload.provider_attempts).toHaveLength(2);
  expect(payload.provider_attempts[0].provider).toBe("gemini");
  expect(payload.selected_provider_ids).toEqual([]);
  expect(payload.provider_match_count).toBe(0);
});

test("Oracle analytics payload normalizes provider-attempt trace shape", async () => {
  const payload = buildOracleEventPayload({
    userId: "00000000-0000-0000-0000-000000000001",
    meta: {
      provider: "tmdb",
      attemptMetrics: {
        providerAttemptCount: 3,
        fallbackDepth: 2,
        providerAttempts: [
          { provider: "gemini", result: "failure", failure_bucket: "timeout", latency_ms: "300" },
          { provider: "openrouter", result: "failure", failure_bucket: "rate_limit", latency_ms: 480 },
          { provider: "tmdb", result: "success", status: "ok", latency_ms: "1000ms" },
        ],
      },
    },
    success: true,
    requestSource: "discover",
    promptType: "custom_prompt",
    recommendationCount: 3,
    tmdbHitCount: 3,
  });

  expect(payload.provider_attempt_count).toBe(3);
  expect(payload.fallback_depth).toBe(2);
  expect(payload.provider_attempts[0].latency_ms).toBe(300);
  expect(payload.provider_attempts[2].provider).toBe("tmdb");
  expect(payload.provider_attempts[2].result).toBe("success");
});

test("Oracle analytics payload remains backward compatible without telemetry block", async () => {
  const payload = buildOracleEventPayload({
    userId: "00000000-0000-0000-0000-000000000001",
    meta: {
      provider: "gemini",
      modelUsed: "gemini-2.0-flash",
      groqUsed: false,
      latency: "900ms",
    },
    success: false,
    errorCode: "gemini_error",
    requestSource: "discover",
    promptType: "custom_prompt",
    recommendationCount: 0,
    tmdbHitCount: 0,
  });

  expect(payload.provider).toBe("gemini");
  expect(payload.latency_ms).toBe(900);
  expect(payload.input_recommendation_count).toBeNull();
  expect(payload.provider_attempt_count).toBeNull();
  expect(payload.provider_attempts).toEqual([]);
  expect(payload.provider_filtered_out_count).toBe(0);
});

test("Oracle analytics payload persists selected provider and ranking metrics", async () => {
  const payload = buildOracleEventPayload({
    userId: "00000000-0000-0000-0000-000000000001",
    meta: {
      provider: "gemini",
      rankingMetrics: {
        matchedRecommendationCount: 3,
        filteredOutCount: 2,
      },
    },
    selectedProviderIds: [8, 337, 8, 9],
    success: true,
    requestSource: "discover",
    promptType: "custom_prompt",
    recommendationCount: 5,
    tmdbHitCount: 5,
  });

  expect(payload.selected_provider_ids).toEqual([8, 337, 9]);
  expect(payload.provider_match_count).toBe(3);
  expect(payload.provider_filtered_out_count).toBe(2);
});

test("Oracle provider-aware ranking promotes matches deterministically", async () => {
  const ranked = rankRecommendationsByProviderAffinity({
    recommendations: [
      { title: "No Match First", year: 2000 },
      { title: "Strong Match", year: 2001 },
      { title: "Weak Match", year: 2002 },
    ],
    tmdbResults: [
      { id: 1, provider_logos: [], vote_average: 8.1, vote_count: 200 },
      {
        id: 2,
        provider_logos: [{ provider_id: 8 }, { provider_id: 337 }],
        vote_average: 7.5,
        vote_count: 150,
      },
      { id: 3, provider_logos: [{ provider_id: 8 }], vote_average: 8.8, vote_count: 500 },
    ],
    providerResults: [{}, {}, {}],
    selectedProviderIds: [8, 337],
  });

  expect(ranked.recommendations.map((rec) => rec.title)).toEqual([
    "Strong Match",
    "Weak Match",
    "No Match First",
  ]);
  expect(ranked.rankingMetrics.matchedRecommendationCount).toBe(2);
  expect(ranked.rankingMetrics.filteredOutCount).toBe(1);
  expect(ranked.rankingMetrics.reorderedCount).toBeGreaterThan(0);
  expect(ranked.rankingMetrics.promotedFirstItem).toBeTruthy();
});

test("Oracle provider-aware ranking preserves order without preferences", async () => {
  const ranked = rankRecommendationsByProviderAffinity({
    recommendations: [{ title: "A" }, { title: "B" }, { title: "C" }],
    tmdbResults: [{ id: 1 }, { id: 2 }, { id: 3 }],
    providerResults: [{}, {}, {}],
    selectedProviderIds: [],
  });

  expect(ranked.recommendations.map((rec) => rec.title)).toEqual(["A", "B", "C"]);
  expect(ranked.rankingMetrics.reorderedCount).toBe(0);
  expect(ranked.rankingMetrics.hasProviderPreferences).toBeFalsy();
  expect(ranked.rankingMetrics.filteredOutCount).toBe(0);
});

