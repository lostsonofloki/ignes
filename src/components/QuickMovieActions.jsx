import { useState } from "react";
import { useUser } from "../context/UserContext";
import { useToast } from "../context/ToastContext";
import AddToListButton from "./AddToListButton";
import LogMovieModal from "./LogMovieModal";
import "./QuickMovieActions.css";

function normalizePosterPath(movie) {
  if (movie?.poster_path) return movie.poster_path;
  if (typeof movie?.Poster === "string") {
    return movie.Poster.replace("https://image.tmdb.org/t/p/w500", "");
  }
  return null;
}

function QuickMovieActions({ movie, className = "" }) {
  const { isAuthenticated } = useUser();
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);

  if (!isAuthenticated) return null;

  const normalizedMovie = {
    tmdb_id: movie?.tmdb_id || movie?.id,
    title: movie?.title || movie?.Title,
    poster_path: normalizePosterPath(movie),
    year: movie?.year || movie?.Year,
  };

  if (!normalizedMovie.tmdb_id || !normalizedMovie.title) return null;

  return (
    <>
      <div className={`quick-movie-actions ${className}`}>
        <AddToListButton movie={normalizedMovie} variant="icon" />
        <button
          type="button"
          className="quick-log-btn"
          onClick={(event) => {
            event.stopPropagation();
            setShowModal(true);
          }}
          title="Log this film"
          aria-label="Log this film"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>

      {showModal && (
        <LogMovieModal
          movie={normalizedMovie}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            toast.success(`"${normalizedMovie.title}" logged successfully!`);
          }}
        />
      )}
    </>
  );
}

export default QuickMovieActions;
