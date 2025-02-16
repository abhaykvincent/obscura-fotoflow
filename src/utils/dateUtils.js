export function formatDate(dateInput) {
  const date = new Date(dateInput); // Ensure it's a Date object
  const now = new Date();

  // Calculate differences for "Today", "Tomorrow", etc.
  const diffInDays = Math.floor((date - now) / (1000 * 60 * 60 * 24)+1);
  
  // Handle "Today", "Tomorrow", etc.
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Tomorrow';
  if (diffInDays === -1) return 'Yesterday';

  // Create a date string with bolded day of the week, day, and month
  const weekday = `<span class="bold">${date.toLocaleDateString(undefined, { weekday: 'long' })}</span>`;
  const day = `<span class="bold">${date.getDate()}</span>`;
  const month = `<span class="bold">${date.toLocaleString(undefined, { month: 'long' })}</span>`;
  const year = date.getFullYear();

  // Format the final date string
  return `${weekday}, ${month} ${day}, ${year}`;
}
export function formatInvitationDate(dateInput) {
  const date = new Date(dateInput); // Ensure it's a Date object
  const now = new Date();

  // Calculate differences for "Today", "Tomorrow", etc.
  const diffInDays = Math.floor((date - now) / (1000 * 60 * 60 * 24)+1);
  
  // Handle "Today", "Tomorrow", etc.
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Tomorrow';
  if (diffInDays === -1) return 'Yesterday';

  // Create a date string with bolded day of the week, day, and month
  const weekday = `<span class="bold">${date.toLocaleDateString(undefined, { weekday: 'long' })}</span>`;
  const day = `<span class="bold day">${date.getDate()}</span>`;
  const month = `<span class="bold month">${date.toLocaleString(undefined, { month: 'long' }).toUpperCase()}</span>`;
  const year = `<span class="bold year">${date.getFullYear()}</span>`;

  // Format the final date string
  return `${day} ${month} ${year}`;
}

export function formatTime(dateInput) {
  // Append today's date if input is time-only (HH:MM)
  const date = new Date(/^\d{2}:\d{2}$/.test(dateInput) 
                        ? `${new Date().toISOString().split('T')[0]}T${dateInput}`
                        : dateInput);

  if (isNaN(date.getTime())) return 'Invalid Date';

  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;

  return `${formattedHours}:${minutes} ${ampm}`;
}

export function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  const intervals = [
    { label: 'y', seconds: 31536000 }, // year
    { label: 'mo', seconds: 2592000 }, // month
    { label: 'w', seconds: 604800 },   // week
    { label: 'd', seconds: 86400 },    // day
    { label: 'h', seconds: 3600 },     // hour
    { label: 'm', seconds: 60 },       // minute
  ];

  // For times less than a minute
  if (seconds < 60) {
    return 'just now';
  }

  // Calculate time difference for larger intervals
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count}${interval.label} ago`;
    }
  }

  return 'just now'; // Fallback
}

export function getEventTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  const future = seconds < 0;
  const absoluteSeconds = Math.abs(seconds);

  const intervals = [
    { label: 'year', seconds: 31536000, futureLabel: 'in' },
    { label: 'month', seconds: 2592000, futureLabel: 'in' },
    { label: 'week', seconds: 604800, futureLabel: 'in' },
    { label: 'day', seconds: 86400, futureLabel: 'in' },
    { label: 'hour', seconds: 3600, futureLabel: 'in' },
    { label: 'minute', seconds: 60, futureLabel: 'in' },
  ];

  // For times less than a minute
  if (absoluteSeconds < 60) {
    return future ? 'soon' : 'just now';
  }

  // Calculate time difference for larger intervals
  for (const interval of intervals) {
    const count = Math.floor(absoluteSeconds / interval.seconds);
    if (count >= 1) {
      if (future) {
        if (count === 1 && interval.label === 'week') {
          return 'Next week';
        } else if (count === 1 && interval.label === 'month') {
          return 'Next month';
        } else if (count === 1 && interval.label === 'year') {
          return 'Next year';
        } else {
          return `${interval.futureLabel} ${count} ${interval.label}${count > 1 ? 's' : ''}`;
        }
      } else {
        if (count === 1 && interval.label === 'day') {
          return 'yesterday';
        } else if (count === 1 && interval.label === 'week') {
          return 'last week';
        } else if (count === 1 && interval.label === 'month') {
          return 'last month';
        } else if (count === 1 && interval.label === 'year') {
          return 'last year';
        } else {
          return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
        }
      }
    }
  }

  return future ? 'soon' : 'Happening now!'; // Fallback
}