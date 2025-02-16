export const fetchLoginLocation = async () => {
    try {
      const response = await fetch('http://ip-api.com/json/');
      const data = await response.json();
      return `${data.city}, ${data.regionName}, ${data.country}`;
    } catch (error) {
      console.error('Error fetching login location:', error);
      return null;
    }
  };