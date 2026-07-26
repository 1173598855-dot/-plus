import nextTaskArtwork from '../../assets/empty-states/next-task.svg?no-inline';
import searchResultsArtwork from '../../assets/empty-states/search-results.svg?no-inline';
import theVoidArtwork from '../../assets/empty-states/the-void.svg?no-inline';
import { useState } from 'react';
import { toolbarLabels } from './taskUiText';

export type EmptyStateVariant = 'board' | 'today' | 'completed' | 'filtered';

const artworkByVariant: Partial<Record<EmptyStateVariant, string>> = {
  today: nextTaskArtwork,
  completed: theVoidArtwork,
  filtered: searchResultsArtwork,
};

interface TaskEmptyStateProps {
  variant: EmptyStateVariant;
  message: string;
  showClearFilters?: boolean;
  onClearFilters: () => void;
  className?: string;
}

export function TaskEmptyState({
  variant,
  message,
  showClearFilters = false,
  onClearFilters,
  className = '',
}: TaskEmptyStateProps) {
  const artwork = artworkByVariant[variant];
  const [failedArtwork, setFailedArtwork] = useState<string>();

  return (
    <div className={`empty-state ${className}`.trim()}>
      {artwork && artwork !== failedArtwork && (
        <img
          className="empty-artwork"
          src={artwork}
          alt=""
          aria-hidden="true"
          data-testid={`empty-artwork-${variant}`}
          onError={() => setFailedArtwork(artwork)}
        />
      )}
      <span>{message}</span>
      {showClearFilters && (
        <button className="clear-filter" type="button" onClick={onClearFilters}>
          {toolbarLabels.clearFilters}
        </button>
      )}
    </div>
  );
}
