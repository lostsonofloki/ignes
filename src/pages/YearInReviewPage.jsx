import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useUser } from "../context/UserContext";
import { getSupabase } from "../supabaseClient";
import { buildYearInReview } from "../utils/yearInReview";
import SeoHead from "../components/seo/SeoHead";
import "./YearInReviewPage.css";

const GENRE_COLORS = [
  "#f97316",
  "#ea580c",
  "#c2410c",
  "#9a3412",
  "#fdba74",
  "#fb923c",
  "#eab308",
  "#ca8a04",
];

const MOOD_COLORS = {
  emotional: "#f87171",
  vibe: "#c084fc",
  intellectual: "#94a3b8",
};

const MOOD_CATEGORIES = {
  bittersweet: "emotional",
  heartwarming: "emotional",
  tearjerker: "emotional",
  uplifting: "emotional",
  bleak: "emotional",
  atmospheric: "vibe",
  dark: "vibe",
  gritty: "vibe",
  neon: "vibe",
  tense: "vibe",
  whimsical: "vibe",
  gory: "vibe",
  eerie: "vibe",
  claustrophobic: "vibe",
  campy: "vibe",
  dread: "vibe",
  "jump-scary": "vibe",
  psychological: "intellectual",
  mindbending: "intellectual",
  challenging: "intellectual",
  philosophical: "intellectual",
  slowburn: "intellectual",
  complex: "intellectual",
};

function formatMoodLabel(id) {
  if (!id) return "";
  const s = String(id);
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ");
}

function moodBarColor(moodId) {
  const cat = MOOD_CATEGORIES[moodId] || "vibe";
  return MOOD_COLORS[cat] || MOOD_COLORS.vibe;
}

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 2015;

function parseYearParam(raw) {
  if (raw == null || raw === "") return CURRENT_YEAR;
  const y = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(y)) return null;
  if (y < MIN_YEAR || y > CURRENT_YEAR) return null;
  return y;
}

function YearInReviewPage() {
  const { year: yearParam } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUser();
  const [logs, setLogs] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const selectedYear = useMemo(() => parseYearParam(yearParam), [yearParam]);

  useEffect(() => {
    if (yearParam != null && yearParam !== "" && selectedYear === null) {
      navigate("/year-in-review", { replace: true });
    }
  }, [yearParam, selectedYear, navigate]);

  const effectiveYear = selectedYear ?? CURRENT_YEAR;

  const fetchLogs = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setLoadError("");
    try {
      const supabase = getSupabase();
      // Omit watched_at until DB migration adds column (see supabase/migrations/*movie_logs_watched_at.sql).
      const { data, error } = await supabase
        .from("movie_logs")
        .select(
          "watch_status, rating, genres, moods, review, created_at, source_upc",
        )
        .eq("user_id", user.id);

      if (error) throw error;
      setLogs(data || []);
    } catch (e) {
      console.error("YearInReview fetch:", e);
      setLoadError(e?.message || "Could not load your logs.");
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchLogs();
    }
  }, [isAuthenticated, user?.id, fetchLogs]);

  const recap = useMemo(
    () => buildYearInReview(effectiveYear, logs),
    [effectiveYear, logs],
  );

  const genrePieData = useMemo(
    () =>
      recap.topGenres.map((g, index) => ({
        name: g.name,
        value: g.count,
        color: GENRE_COLORS[index % GENRE_COLORS.length],
      })),
    [recap.topGenres],
  );

  const moodBarData = useMemo(
    () =>
      recap.topMoods.map((m) => ({
        name: formatMoodLabel(m.name),
        count: m.count,
        moodId: m.name,
      })),
    [recap.topMoods],
  );

  const yearOptions = useMemo(() => {
    const list = [];
    for (let y = CURRENT_YEAR; y >= MIN_YEAR; y--) list.push(y);
    return list;
  }, []);

  if (!isAuthenticated) return null;

  const pathname =
    effectiveYear === CURRENT_YEAR && (yearParam == null || yearParam === "")
      ? "/year-in-review"
      : `/year-in-review/${effectiveYear}`;

  return (
    <div className="year-in-review-page">
      <SeoHead
        title={`Year in Review ${effectiveYear}`}
        description={`Your Filmgraph recap for ${effectiveYear}: films watched, ratings, genres, moods, and more.`}
        pathname={pathname}
      />

      <div className="yir-container">
        <header className="yir-header">
          <Link to="/profile" className="yir-back">
            ← Profile
          </Link>
          <h1 className="yir-title">Year in Review</h1>
          <p className="yir-subtitle">
            Your film year — wrapped in orange (well, amber).
          </p>

          <div className="yir-year-row">
            <label htmlFor="yir-year-select" className="yir-year-label">
              Year
            </label>
            <select
              id="yir-year-select"
              className="yir-year-select"
              value={effectiveYear}
              onChange={(e) => {
                const y = Number(e.target.value);
                if (y === CURRENT_YEAR) navigate("/year-in-review");
                else navigate(`/year-in-review/${y}`);
              }}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </header>

        {loadError && (
          <div className="yir-alert yir-alert--error" role="alert">
            {loadError}
          </div>
        )}

        {isLoading ? (
          <div className="yir-loading">
            <div className="yir-spinner" aria-hidden />
            <p>Pulling your year…</p>
          </div>
        ) : recap.filmCount === 0 ? (
          <div className="yir-empty">
            <h2 className="yir-empty-title">No watched films in {effectiveYear}</h2>
            <p className="yir-empty-copy">
              Logs marked watched with a date in {effectiveYear} show up here.
              Start logging or move back a year if your history lives in another
              calendar year.
            </p>
            <Link to="/library" className="yir-empty-cta">
              Go to Library
            </Link>
            <p className="yir-disclaimer yir-disclaimer--muted">
              Based on log dates ({effectiveYear}). Manual watch-date editing
              coming soon.
            </p>
          </div>
        ) : (
          <>
            <section className="yir-hero">
              <div className="yir-hero-stat">
                <span className="yir-hero-number">{recap.filmCount}</span>
                <span className="yir-hero-label">
                  films watched in {effectiveYear}
                </span>
              </div>
              <div className="yir-hero-meta">
                {recap.avgRating != null ? (
                  <p>
                    <strong>Average rating:</strong> {recap.avgRating} / 5
                    <span className="yir-meta-note">
                      {" "}
                      ({recap.ratedFilmCount} rated)
                    </span>
                  </p>
                ) : (
                  <p>
                    <strong>Average rating:</strong> — (add ratings to your logs
                    for this stat)
                  </p>
                )}
                <p>
                  <strong>Reviews written:</strong> {recap.reviewsWrittenCount}
                </p>
                <p>
                  <strong>From your shelf (UPC):</strong>{" "}
                  {recap.physicalScanCount}
                </p>
              </div>
            </section>

            <section className="yir-section">
              <h2 className="yir-section-title">Films per month</h2>
              <div className="yir-chart-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={recap.monthlyCounts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="label" stroke="#888888" fontSize={11} />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #2a2a2a",
                        borderRadius: "8px",
                        color: "#ffffff",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#f97316"
                      radius={[4, 4, 0, 0]}
                      name="Films"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {recap.ratingHistogram.length > 0 && (
              <section className="yir-section">
                <h2 className="yir-section-title">Rating distribution</h2>
                <div className="yir-chart-wrap">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={recap.ratingHistogram}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                      <XAxis dataKey="rating" stroke="#888888" fontSize={11} />
                      <YAxis
                        stroke="#888888"
                        fontSize={11}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid #2a2a2a",
                          borderRadius: "8px",
                          color: "#ffffff",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#ea580c"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {genrePieData.length > 0 && (
              <section className="yir-section">
                <h2 className="yir-section-title">Top genres</h2>
                <div className="yir-chart-wrap yir-chart-wrap--pie">
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={genrePieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={110}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                      >
                        {genrePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid #2a2a2a",
                          borderRadius: "8px",
                          color: "#ffffff",
                        }}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{
                          paddingTop: "16px",
                          color: "#888888",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {moodBarData.length > 0 && (
              <section className="yir-section">
                <h2 className="yir-section-title">Top moods</h2>
                <div className="yir-chart-wrap">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={moodBarData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                      <XAxis
                        type="number"
                        stroke="#888888"
                        fontSize={11}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#888888"
                        fontSize={11}
                        width={100}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid #2a2a2a",
                          borderRadius: "8px",
                          color: "#ffffff",
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {moodBarData.map((entry) => (
                          <Cell
                            key={entry.moodId}
                            fill={moodBarColor(entry.moodId)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            <footer className="yir-footer">
              <p className="yir-disclaimer">
                Based on log dates (watch date when set, otherwise first logged
                date). Manual watch-date editing coming soon.
              </p>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

export default YearInReviewPage;
