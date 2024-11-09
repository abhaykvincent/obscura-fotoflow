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
