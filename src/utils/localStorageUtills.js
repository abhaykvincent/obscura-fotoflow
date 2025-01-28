export const storeLimitContext = (feature, context) => {
    const limitData = {
      feature,
      context,
      timestamp: new Date().toISOString(), // Record when the limit was reached
    };
  
    // Store the data in localStorage
    localStorage.setItem('limitContext', JSON.stringify(limitData));
  };

  export const retrieveLimitContext = () => {
    // Retrieve the data from localStorage
    const limitData = JSON.parse(localStorage.getItem('limitContext'));
  
    if (!limitData) {
      return 'No limit reached yet.'; // Default message if no context is stored
    }
  
    // Format the context into a label
    const { feature, context, timestamp } = limitData;
    const date = new Date(timestamp).toLocaleString(); // Format the timestamp
  
    return `Unlimited ${feature} -- Upgrade to Studio.`;
  };

  export const storeProjectsViewType = (viewType) => {
    localStorage.setItem('projectsViewType', viewType);
  };
  export const retrieveProjectsViewType = () => {
    return localStorage.getItem('projectsViewType');
  };