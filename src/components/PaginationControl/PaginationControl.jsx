import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectUserStudio } from '../../app/slices/authSlice';
const checkForSelectedImages = (images) => {
  // Checks if any of the images have a 'selected' status.
  for (let i = 0; i < images.length; i++) {
    if (images[i].status==="selected") {
      console.log(images[i].status)
      return true;
    }
  }
  return false;
};

const PaginationButton = ({ onClick, disabled, children,className, active,highlight ,selected}) => (
  <button
    className={`button light-mode  ${selected} ${selected?'selected':''} ${active ? 'secondary outline' : (highlight?'primary':'secondary')} ${disabled ? 'disabled' : ''}`}
    onClick={onClick}
    disabled={disabled}
    aria-current={active ? 'page' : undefined}
  >
    {children}
  </button>
);
const PageNumbers = ({ currentPage, totalPages, handlePageChange ,images}) => {
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  if (totalPages <= 5) {
    return pageNumbers.map((number) => (
      <PaginationButton
        key={number}
        onClick={() => handlePageChange(number)}
        active={currentPage === number}
        selected={checkForSelectedImages(images)}
      >
        {number}
      </PaginationButton>
    ));
  }

  return (
    <>
      <PaginationButton onClick={() => handlePageChange(1)} active={currentPage === 1}>1</PaginationButton>
      {currentPage > 3 && <span className="ellipsis">...</span>}
      {currentPage === totalPages && <PaginationButton onClick={() => handlePageChange(totalPages - 2)}>{totalPages - 2}</PaginationButton>}
      {currentPage > 2 && currentPage < totalPages && (
        <PaginationButton onClick={() => handlePageChange(currentPage - 1)}>{currentPage - 1}</PaginationButton>
      )}
      {currentPage !== 1 && currentPage !== totalPages && (
        <PaginationButton onClick={() => handlePageChange(currentPage)} active>{currentPage}</PaginationButton>
      )}
      {currentPage < totalPages - 1 && currentPage > 1 && (
        <PaginationButton onClick={() => handlePageChange(currentPage + 1)}>{currentPage + 1}</PaginationButton>
      )}
      {currentPage === 1 && <PaginationButton onClick={() => handlePageChange(3)}>3</PaginationButton>}
      {currentPage < totalPages - 2 && <span className="ellipsis">...</span>}
      <PaginationButton onClick={() => handlePageChange(totalPages)} active={currentPage === totalPages}>{totalPages}</PaginationButton>
    </>
  );
};

export default function PaginationControl({ 
  images,
  currentPage, 
  totalPages, 
  handlePageChange, 
  saveSelection,
  completeSelection,
  currentCollectionIndex,
  totalCollections,
  project
}) {
  const isLastPage = currentPage === totalPages || totalPages === 0;
  const isLastCollection = currentCollectionIndex === totalCollections;
  
  const currentStudio = useSelector(selectUserStudio)
  return (
    <nav className="pagination" aria-label="Pagination">


    {/* Page Numbers */}
    {
      // If first page, show previous button as Previous Gallery if not first collection
      (currentPage === 1 && currentCollectionIndex !== 0) ? 
      // 
      <PaginationButton
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      > Previous</PaginationButton>
      :
      //
      <PaginationButton
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >Previous</PaginationButton>
    }
    {/* Page Numbers */}
    {
      totalPages !== 0 ? (
        <PageNumbers
            images={images}
            currentPage={currentPage}
            totalPages={totalPages}
            handlePageChange={handlePageChange}
        />
      ) : (
        <p>Go to</p>
      )
    }

      {isLastPage ? (
        isLastCollection ? (
          <PaginationButton highlight={true} onClick={()=>{
            
            saveSelection() 
            completeSelection()
            }}>
            Finish
          </PaginationButton>
        ) : (
          <Link to={`/${currentStudio.domain}/selection/${project.id}/${project.collections[currentCollectionIndex].id}`}>
            <PaginationButton
            highlight={true} 
              onClick={() => {
                handlePageChange(currentPage + 1);
                saveSelection();
              }}
            >
              Next Collection
            </PaginationButton>
          </Link>
        )
      ) : (
        <PaginationButton
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          highlight={true} 
        >
          Next
        </PaginationButton>
      )}
    </nav>
  );
}
// Line Complexity  1.5 -> 1.1 -> 1.4