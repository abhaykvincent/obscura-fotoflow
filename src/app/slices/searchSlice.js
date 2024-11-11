// src/slices/searchSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { selectProjects } from './projectsSlice';
import { format } from 'date-fns'; // Use date-fns for date formatting

// src/slices/searchSlice.js

export const searchProjects = createAsyncThunk(
    'search/searchProjects',
    async (query, { getState }) => {
      const projects = selectProjects(getState());
      const queries = query.toLowerCase().split(' ').filter(Boolean); // Split query by space
      const monthMap = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
      // Helper function to match dates
      const isDateMatch = (createdAt, query) => {
        const date = new Date(createdAt);
        console.log(new Date(createdAt).getDate())
        const month = monthMap[date.getMonth()] // Months are 0-indexed
        const day = date.getDate().toString()
        console.log(month, day)
        // Check if query matches day or part of the month name
        const monthMatch = Object.keys(monthMap).some(
            month => monthMap[month].includes(query)
        );
        console.log(monthMatch)
        return monthMatch || query.includes(day);
      };
  
      const projectResults = projects.filter((project) =>
        queries.every(q =>
          project.name.toLowerCase().includes(q) ||
          project.type.toLowerCase().includes(q) ||
          isDateMatch(project.createdAt, q)
        )
      );
  
      const collectionResults = projects.flatMap(project =>
        project.collections.filter(collection =>
          queries.every(q =>
            collection.name.toLowerCase().includes(q)
          )
        ).map(collection => ({
          ...collection,
          projectName: project.name, // Add project name for context
          projectId: project.id
        }))
      );
  
      return { projectResults, collectionResults };
    }
  );
  


  

  
  
// src/slices/searchSlice.js

const searchSlice = createSlice({
    name: 'search',
    initialState: {
      query: '',
      projectResults: [], // Separate state for projects
      collectionResults: [], // Separate state for collections
      status: 'idle',
      error: null,
    },
    reducers: {
      updateSearchQuery(state, action) {
        state.query = action.payload;
      },
      resetSearchQuery(state) {
        state.query = ''; // Reset the query state
        state.projectResults = []; // Optionally clear the results
        state.collectionResults = []; // Optionally clear the results
      },
    },
    extraReducers: (builder) => {
      builder
        .addCase(searchProjects.pending, (state) => {
          state.status = 'loading';
        })
        .addCase(searchProjects.fulfilled, (state, action) => {
          state.status = 'succeeded';
          state.projectResults = action.payload.projectResults;
          state.collectionResults = action.payload.collectionResults;
        })
        .addCase(searchProjects.rejected, (state, action) => {
          state.status = 'failed';
          state.error = action.error.message;
        });
    },
  });
  
  // Selectors
  export const selectProjectResults = (state) => state.search?.projectResults || [];
  export const selectCollectionResults = (state) => state.search?.collectionResults || [];
  export const selectSearchStatus = (state) => state.search?.status || 'idle';
  export const selectQuery = (state) => state.search?.query || '';
  

export const { updateSearchQuery,resetSearchQuery } = searchSlice.actions;

// Selectors

export default searchSlice.reducer;
