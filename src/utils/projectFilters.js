  // Project Filters
  export const getRecentProjects = (projects, limit) => {
    // Create a shallow copy of the projects array to avoid mutating the original
    const projectsCopy = [...projects];
    return projectsCopy.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  };
  export const getProjectsByStatus = (projects, status) => {
    return projects.filter(project => project.status === status);
  };