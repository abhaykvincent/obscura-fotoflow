// src/components/SearchInput.jsx

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectQuery, selectSearchStatus, updateSearchQuery } from '../../app/slices/searchSlice';
import './Search.scss'

const SearchInput = () => {
  const [query, setQuery] = useState(useSelector(selectQuery));
  const [status,setStatus] = useState(useSelector(selectSearchStatus))
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const inputElement =  useRef(null);
// focus input by default if no query or in search page route
  useEffect(() => {
    if(query.length === 0 ||  window.location.pathname === '/search')
      inputElement.current.focus();
  }, []);
  // Debounced function to avoid triggering search on every keystroke
  const handleSearch = useCallback(
    debounce((query) => {
      dispatch(updateSearchQuery(query));
      if (query.trim()) {
        navigate('/search'); // Navigate to the search page when there’s a query
      }
    }, 500), // Adjust debounce delay as needed
    [dispatch, navigate]
  );

  const handleChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setStatus('loading')
    handleSearch(newQuery);
  };

  return (
    <div className="search-input-wrapper">
      <input
      ref={inputElement}
        type="text"
        placeholder="Search Studio"
        value={query}
        onChange={handleChange}
        className={`search-input ${status}`}
      />
      <div className="button icon icon-only search"></div>
    </div>
    
  );
};

export default SearchInput;
