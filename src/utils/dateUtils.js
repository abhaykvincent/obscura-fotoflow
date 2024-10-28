export function formatDate(dateInput) {
    const date = new Date(dateInput); // Ensure it's a Date object
    const now = new Date();
  
    // Calculate differences for "Today", "Tomorrow", etc.
    const diffInDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));
    
    // Handle "Today", "Tomorrow", etc.
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Tomorrow';
    if (diffInDays === -1) return 'Yesterday';
  
    // Create a future-proof date string (based on the user's locale)
    return date.toLocaleDateString(undefined, {
      weekday: 'long',   // e.g., "Monday"
      year: 'numeric',   // e.g., "2024"
      month: 'long',     // e.g., "October"
      day: 'numeric',    // e.g., "27"
    });
  }
  