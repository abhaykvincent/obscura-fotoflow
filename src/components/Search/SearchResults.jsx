// src/pages/SearchResults.jsx

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { searchProjects, selectQuery, selectProjectResults, selectCollectionResults, selectSearchStatus, resetSearchQuery } from '../../app/slices/searchSlice';
import ProjectCard from '../Project/ProjectCard/ProjectCard';
import CollectionCard from '../Project/CollectionsCard/CollectionsCard';
import SearchInput from './SearchInput';

const SearchResultsMessage = ({ projectResults, collectionResults }) => {
    const renderMessage = () => {
      const totalResults = projectResults.length + collectionResults.length;
      if (totalResults === 0) {
        return 'No results found';
      }
      return `${totalResults} ${totalResults === 1 ? 'result' : 'results'} found`;
    };
  
    return (
      <h4 className="welcome-message sub-message">
        {renderMessage()}
      </h4>
    );
};

const SearchResults = () => {
  const dispatch = useDispatch();
  const projectResults = useSelector(selectProjectResults);
  const collectionResults = useSelector(selectCollectionResults);
  const status = useSelector(selectSearchStatus);
  const query = useSelector(selectQuery);

  const searchResultClick = () => {
    // when any of the search results are clicked, reset the search query to empty string
    dispatch(resetSearchQuery());
  };


  useEffect(() => {
    dispatch(searchProjects(query));
  }, [query, dispatch]);

  if (status === 'loading') return <p>Loading...</p>;
  if (status === 'failed') return <p>Something went wrong. Please try again.</p>;

  return (<>
    <div className="search-header">
            <div className="search-bar">
                <SearchInput />
            </div>
            </div>
    <main className="search-results">
        <div className="welcome-section">
            <div className="welcome-content">
            <div className='welcome-message-top user-name'>
                <h1 className='welcome-message '>Search results for '<span className='iconic-gradient'>{query}</span>'</h1>
            </div>
            <SearchResultsMessage projectResults={projectResults} collectionResults={collectionResults}/>
            </div>
        </div>
        {projectResults.length > 0 && <h3 className='search-result-section-label'>Projects</h3>}
        <div className="projects-list">
        {projectResults.length > 0 && (
            <>
            {projectResults.map((project) => (
                <div onClick={searchResultClick} key={project.id} >
              <ProjectCard project={project}  />
          </div>
            ))}
            </>
        )}
        </div>
        {collectionResults.length > 0 &&<h3 className='search-result-section-label'>Collections</h3>}
      <div className="projects-list">
        {collectionResults.length > 0 && (
            <>
            {collectionResults.map((collection) => (
                <div onClick={searchResultClick}>
                
                <CollectionCard collection={collection} onClick={searchResultClick} />
                </div>
        ))}
        </>
        )}
      </div>
    </main>
  </>

  );
};

export default SearchResults;
