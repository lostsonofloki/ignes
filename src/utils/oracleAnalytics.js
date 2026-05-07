import { getOracleFailureBucket } from "./oracleReliability";

const ADMIN_EMAIL = "sonofloke@gmail.com";

const cleanText = (value) => {
  if (!value) return null;
  return String(value).trim().slice(0, 500) || null;
};

const parseOptionalNonNegativeInt = (value) => {
  if (value == null || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
};

const normalizeProviderAttempt = (attempt) => {
  if (!attempt || typeof attempt !== "object") return null;
  const latency = parseOptionalNonNegativeInt(attempt.latency_ms);
  return {
    provider: cleanText(attempt.provider),
    model: cleanText(attempt.model),
    result: cleanText(attempt.result),
    status: cleanText(attempt.status),
    failure_bucket: cleanText(attempt.failure_bucket),
    latency_ms: latency,
  };
};

const normalizeProviderAttempts = (attempts) => {
  if (!Array.isArray(attempts)) return [];
  return attempts
    .map((attempt) => normalizeProviderAttempt(attempt))
    .filter(Boolean);
};

const normalizeSelectedProviderIds = (providerIds) => {
  if (!Array.isArray(providerIds)) return [];
  const seen = new Set();
  return providerIds
    .map((value) => Number.parseInt(String(value), 10))
    .filter((value) => Number.isFinite(value) && value > 0)
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
};

export const parseLatencyMs = (latency) => {
  if (typeof latency === "number" && Number.isFinite(latency)) {
    return Math.max(0, Math.round(latency));
  }
  if (!latency) return null;

  const match = String(latency).match(/(\d+)\s*ms/i);
  if (!match) return null;

  const value = Number.parseInt(match[1], 10);
  return Number.isNaN(value) ? null : Math.max(0, value);
};

export const classifyOracleError = (error) => {
  const provider = String(error?.provider || "");
  const status = String(error?.status || "");
  const raw = String(error?.message || error || "").toLowerCase();
  const tagged = raw.match(/\[oracle:([a-z]+)(?::(\d+))?\]/i);
  const taggedProvider = tagged?.[1] || provider || null;
  const taggedStatus = tagged?.[2] || status || null;
  const failureBucket = getOracleFailureBucket(error);
  const failureStage = taggedProvider || "orchestration";
  if (!raw) return { errorCode: null, fallbackReason: null };

  if (raw.includes("daily oracle limit")) {
    return {
      errorCode: "budget_limit",
      fallbackReason: "budget_limit",
      provider: taggedProvider,
      statusCode: taggedStatus,
      failureBucket,
      failureStage,
    };
  }
  if (raw.includes("openrouter")) {
    return {
      errorCode:
        taggedStatus === "429" ? "openrouter_rate_limited" : "openrouter_error",
      fallbackReason: "openrouter_unavailable",
      provider: taggedProvider || "openrouter",
      statusCode: taggedStatus,
      failureBucket,
      failureStage,
    };
  }
  if (raw.includes("tmdb")) {
    return {
      errorCode: taggedStatus === "429" ? "tmdb_rate_limited" : "tmdb_error",
      fallbackReason: "tmdb_unavailable",
      provider: taggedProvider || "tmdb",
      statusCode: taggedStatus,
      failureBucket,
      failureStage,
    };
  }
  if (raw.includes("gemini") || raw.includes("oracle is silent")) {
    return {
      errorCode:
        taggedStatus === "429" ? "gemini_rate_limited" : "gemini_error",
      fallbackReason: "gemini_unavailable",
      provider: taggedProvider || "gemini",
      statusCode: taggedStatus,
      failureBucket,
      failureStage,
    };
  }
  if (raw.includes("network") || raw.includes("fetch")) {
    return {
      errorCode: "network_error",
      fallbackReason: "network_error",
      provider: taggedProvider,
      statusCode: taggedStatus,
      failureBucket,
      failureStage,
    };
  }

  return {
    errorCode: "unknown_error",
    fallbackReason: null,
    provider: taggedProvider,
    statusCode: taggedStatus,
    failureBucket,
    failureStage,
  };
};

export const buildOracleEventPayload = ({
  userId,
  meta,
  success,
  fallbackReason,
  errorCode,
  failureBucket,
  failureStage,
  errorMessage,
  budgetSource,
  requestSource,
  promptType,
  recommendationCount = 0,
  tmdbHitCount = 0,
  selectedProviderIds = [],
}) => {
  const safeRecommendations = Math.max(0, Number(recommendationCount) || 0);
  const safeHits = Math.max(0, Number(tmdbHitCount) || 0);
  const tmdbHitRate =
    safeRecommendations > 0 ? safeHits / safeRecommendations : 0;
  const qualityMetrics = meta?.qualityMetrics || {};
  const attemptMetrics = meta?.attemptMetrics || {};
  const rankingMetrics = meta?.rankingMetrics || {};
  const resolvedSelectedProviderIds = normalizeSelectedProviderIds(
    selectedProviderIds.length > 0 ? selectedProviderIds : meta?.selectedProviderIds,
  );

  return {
    user_id: userId,
    provider: cleanText(meta?.provider) || "unknown",
    model_used: cleanText(meta?.modelUsed),
    groq_used: Boolean(meta?.groqUsed),
    latency_ms: parseLatencyMs(meta?.latency),
    success: Boolean(success),
    fallback_reason: cleanText(fallbackReason || meta?.fallbackReason),
    error_code: cleanText(errorCode),
    failure_bucket: cleanText(failureBucket),
    failure_stage: cleanText(failureStage),
    error_message: cleanText(errorMessage),
    budget_source: cleanText(budgetSource),
    request_source: cleanText(requestSource),
    prompt_type: cleanText(promptType),
    recommendation_count: safeRecommendations,
    tmdb_hit_count: safeHits,
    tmdb_hit_rate: Number(tmdbHitRate.toFixed(4)),
    input_recommendation_count: parseOptionalNonNegativeInt(
      qualityMetrics.inputRecommendationCount,
    ),
    post_filter_recommendation_count: parseOptionalNonNegativeInt(
      qualityMetrics.postFilterRecommendationCount,
    ),
    dedupe_dropped_count: parseOptionalNonNegativeInt(
      qualityMetrics.dedupeDroppedCount,
    ),
    rejected_violation_attempt_count: parseOptionalNonNegativeInt(
      qualityMetrics.rejectedViolationAttemptCount,
    ),
    provider_attempt_count: parseOptionalNonNegativeInt(
      attemptMetrics.providerAttemptCount,
    ),
    fallback_depth: parseOptionalNonNegativeInt(attemptMetrics.fallbackDepth),
    provider_attempts: normalizeProviderAttempts(attemptMetrics.providerAttempts),
    selected_provider_ids: resolvedSelectedProviderIds,
    provider_match_count:
      parseOptionalNonNegativeInt(rankingMetrics.matchedRecommendationCount) || 0,
    provider_filtered_out_count:
      parseOptionalNonNegativeInt(rankingMetrics.filteredOutCount) || 0,
  };
};

export const trackOracleProviderEvent = async (eventPayload) => {
  try {
    const { getSupabase } = await import("../supabaseClient");
    const supabase = getSupabase();
    const { error } = await supabase
      .from("oracle_provider_events")
      .insert(eventPayload);

    if (error) {
      console.warn("Oracle analytics insert failed:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error) {
    console.warn("Oracle analytics insert threw:", error.message);
    return { success: false, error: error.message };
  }
};

export const trackOracleProviderEventSafe = (eventPayload) => {
  queueMicrotask(async () => {
    await trackOracleProviderEvent(eventPayload);
  });
};

export const isOracleAnalyticsAdmin = (user) => user?.email === ADMIN_EMAIL;
