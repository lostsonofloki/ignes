import './Skeleton.css';

/**
 * Skeleton Loader Component
 * Used for loading states instead of plain text
 */
export function Skeleton({ className = '', variant = 'rect', width, height }) {
  const classes = `skeleton skeleton-${variant} ${className}`;
  
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;
  
  return <div className={classes} style={style} />;
}

/**
 * Movie Card Skeleton - Placeholder for movie cards
 */
export function MovieCardSkeleton() {
  return (
    <div className="movie-card-skeleton">
      <Skeleton variant="rect" className="skeleton-poster" />
      <Skeleton variant="text" className="skeleton-title" />
    </div>
  );
}

/**
 * Grid of skeletons for loading states
 */
export function MovieGridSkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}
