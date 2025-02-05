  // Project Filters
  export const getRecentProjects = (projects, limit) => {
    // Create a shallow copy of the projects array to avoid mutating the original
    const projectsCopy = [...projects];
    return projectsCopy.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  };
  // getproject by l;ast opened
  export const getProjectsByLastUpdated = (projects, limit) => {
    // Create a shallow copy of the projects array to avoid mutating the original
    const projectsCopy = [...projects];
    return projectsCopy.sort((a, b) => b.lastOpened - a.lastOpened).slice(0, limit);
  };
  export const getProjectsByStatus = (projects, status) => {
    return projects.filter(project => project.status === status);
  };

  export const getUpcommingShoots = (projects, buffer) => {
    // find all events from all projects array and return all events in buffer days
    const shoots = projects.reduce((acc, project) => {
      return [...acc, ...project.events];
    }, []);
    const today = new Date();
    const bufferDate = new Date(today.getTime() + buffer * 24 * 60 * 60 * 1000);
    console.log(shoots)
    return shoots.filter(shoot => new Date(shoot.date) >= bufferDate);

  };