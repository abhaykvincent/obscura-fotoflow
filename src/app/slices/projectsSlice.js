// slices/authSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fullAccess } from '../../data/teams';
import { addBudgetToFirestore, addCollectionToFirestore, addCollectionToStudioProject, addCrewToFirestore, addEventToFirestore, addExpenseToFirestore, addPaymentToFirestore, addProjectToStudio, deleteCollectionFromFirestore, deleteProjectFromFirestore, fetchProjectsFromFirestore } from '../../firebase/functions/firestore';
import { showAlert } from './alertSlice';


const initialState = {
  data: [],
  status: '',
  loading : false,
  error: null,
};
// Projects
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects', 
  ({currentDomain}) => {
  return fetchProjectsFromFirestore(currentDomain)
  }
);

export const addProject = createAsyncThunk(
  'projects/addProject',
  ({domain,projectData}) => {
    console.log(domain,projectData)
    return addProjectToStudio(domain,projectData)}
);


export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  ({domain,projectId}) => { 
    console.log()
    deleteProjectFromFirestore(domain, projectId);
    return projectId;
  }
);

// Collections
export const addCollection = createAsyncThunk(
  'projects/addCollection',
  async ({ domain, projectId, newCollection }, { dispatch }) => {
    console.log(domain)
    const id = await addCollectionToStudioProject(domain,projectId, newCollection);
    return {projectId, collection: {id,...newCollection}}
  }
);

export const deleteCollection = createAsyncThunk(
  'projects/deleteCollection',
  async ({ domain,projectId, collectionId }, { dispatch }) => {
    console.log(domain, projectId, collectionId)
    await deleteCollectionFromFirestore(domain,projectId, collectionId);
    return { projectId, collectionId };
  }
);
// Event
export const addEvent = createAsyncThunk(
  'projects/addEvent',
  async ({ domain, projectId, newEvent }, { dispatch }) => {
    const id = await addEventToFirestore(domain,projectId, newEvent);
    return ({projectId:projectId, newEvent:{id, ...newEvent}})
  }
);
// Crew
export const addCrew = createAsyncThunk(
  'projects/addCrew',
  async ({ domain, projectId, eventId, crewData }, { dispatch }) => {
    console.log(domain)
    await addCrewToFirestore(domain, projectId, eventId, crewData);
    return { projectId, eventId, crewData };
  }
);
// Financials
// Payments
export const addPayment =  createAsyncThunk(
  'projects/addPayment',
  async ({ domain,projectId, paymentData }, { dispatch }) => {
    console.log({ domain, projectId, paymentData })
    await addPaymentToFirestore(domain, projectId, paymentData);
    return { projectId, paymentData };
  }
);
// Expenses
export const addExpense =  createAsyncThunk(
  'projects/addExpense',
  async ({ domain,projectId, paymentData }, { dispatch }) => {
    console.log({ domain,projectId, paymentData })
    await addExpenseToFirestore(domain,projectId, paymentData);
    return { projectId, expenseData:paymentData };
  }
);
export const addBudget =  createAsyncThunk(
  'projects/addBudget',
  async ({ domain,projectId, budgetData }, { dispatch }) => {
    budgetData = await addBudgetToFirestore(domain, projectId, budgetData);
    console.log(budgetData)
    return {projectId,budgetData};
  }
);


const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects_temp: (state, action) => {
      state.data = action.payload;
    },
  },
  extraReducers: (builder) => {

    // Fetch projects
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      });
      
      // Add project
      builder
      .addCase(addProject.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
     .addCase(addProject.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        state.data.push(action.payload);
        
      })
     .addCase(addProject.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      });

      // Delete project
      builder
      .addCase(deleteProject.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.status = 'succeeded';
        console.log("deleted id is "+action.payload)
        state.loading = false;
        state.data = state.data.filter(project => project.id !== action.payload);
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      });
      // Add collection
      builder
      .addCase(addCollection.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(addCollection.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        const { projectId, collection } = action.payload;
        state.data = state.data.map((project) => {
          if (project.id === projectId) {
            const updatedCollections = [...project.collections, collection];
            return { ...project, collections: updatedCollections };
          }
          return project;
        });
      })
      .addCase(addCollection.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      })
      // Delete collection
      builder
      .addCase(deleteCollection.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(deleteCollection.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        const { projectId, collectionId } = action.payload;
        state.data = state.data.map((project) => {
          if (project.id === projectId) {
            const updatedCollections = project.collections.filter(collection => collection.id!== collectionId);
            return { ...project, collections: updatedCollections };
          }
        return project;
        }
      )})
      .addCase(deleteCollection.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      })
      // Add Event
      builder
      .addCase(addEvent.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(addEvent.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        const { projectId, newEvent } = action.payload;
        state.data = state.data.map((project) => {
          if (project.id === projectId) {
            const updatedEvents = [...project.events, newEvent];
            return { ...project, events: updatedEvents };
          }
          return project;
        });
      })
      .addCase(addEvent.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      })
      // Add Crue
      builder
      .addCase(addCrew.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(addCrew.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        const { projectId, eventId, crewData } = action.payload;
        state.data = state.data.map((project) => {
          if (project.id === projectId) {
            const updatedEvents = project.events.map((event) => {
              if (event.id === eventId) {
                const updatedCrew = [...event.crews, crewData];
                return { ...event, crews: updatedCrew };
              }
              return event;
            });
            return { ...project, events: updatedEvents };
          }
          return project;
        });
      })
      .addCase(addCrew.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      });
      // Add payment
      builder
      .addCase(addPayment.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
     .addCase(addPayment.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        const { projectId, paymentData } = action.payload;
        state.data = state.data.map((project) => {
          if (project.id === projectId) {
            const updatedPayments = [...project.payments, paymentData];
            return { ...project, payments: updatedPayments };
          }
          return project;
        });
        console.log(paymentData);
      })
     .addCase(addPayment.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      });
      // Add Expense
      builder
      .addCase(addExpense.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(addExpense.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        const { projectId, expenseData } = action.payload;
        console.log(expenseData);
        state.data = state.data.map((project) => {
          if (project.id === projectId) {
            const updatedExpenses = [...project.expenses, expenseData];
            return { ...project, expenses: updatedExpenses };
          }
          return project;
        });
      })
      .addCase(addExpense.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      });


      // set Budget
      builder
     .addCase(addBudget.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(addBudget.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        const { projectId, budgetData } = action.payload;
        console.log({ projectId, budgetData })
        state.data = state.data.map((project) => {
          if (project.id === projectId) {
            return { ...project, budgets: budgetData };
          }
          console.log(project)
          return project;
        });
      })
     .addCase(addBudget.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setProjects_temp } = projectsSlice.actions;
export default projectsSlice.reducer;

// Selector to get projects data from the state
export const selectProjects = (state) => state.projects.data;
export const selectProjectsStatus = (state) => state.projects.status;
export const selectLoading = (state) => state.projects.loading;
