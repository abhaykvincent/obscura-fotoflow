import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { trackEvent } from '../../analytics/utils';

/**
 * PaginationButton Component: A styled button used for navigation.
 */
const PaginationButton = ({ onClick, disabled, children, className, highlight }) => (
  <button
    className={`button light-mode ${highlight ? 'primary' : 'secondary'} ${disabled ? 'disabled' : ''} ${className || ''}`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

/**
 * PaginationControl Component: Simplified navigation showing only Previous and Next/Finish.
 * Removed page numbers as per user request.
 */
export default function PaginationControl({ 
  images,
  currentPage, 
  totalPages, 
  handlePageChange, 
  saveSelection,
  completeSelection,
  completeCollection,
  currentCollectionIndex,
  totalCollections,
  project
}) {
  const { studioName } = useParams();
  
  const isLastPage = currentPage === totalPages || totalPages === 0;
  
  // Find the next collection that has selectionGallery enabled
  const nextSelectableCollection = project.collections
    .slice(currentCollectionIndex)
    .find(c => c.selectionGallery !== false);
  
  const isLastCollection = !nextSelectableCollection;
  
  return (
    <nav className="pagination" aria-label="Pagination">
      {/* Previous Button */}
      <PaginationButton
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </PaginationButton>

      {/* Action/Next Button */}
      {isLastPage ? (
        isLastCollection ? (
          <PaginationButton 
            highlight={true} 
            onClick={() => {
              saveSelection();
              completeSelection();
              trackEvent('selection_completed', { project_id: project.id });
            }}
          >
            Finish
          </PaginationButton>
        ) : (
          <Link to={`/${studioName}/selection/${project.id}/${nextSelectableCollection.id}`}>
            <PaginationButton
              highlight={true} 
              onClick={() => {
                handlePageChange(1); // Reset to first page of next collection
                completeCollection();
              }}
            >
              Next Collection
            </PaginationButton>
          </Link>
        )
      ) : (
        <PaginationButton
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={isLastPage}
          highlight={true} 
        >
          Next
        </PaginationButton>
      )}
    </nav>
  );
}
