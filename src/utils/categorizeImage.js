export const categorizeImagesByTime = (images, threshold = 600) => {
    // Convert threshold from minutes to seconds (10 minutes = 600 seconds)
    const categories = [];
    let currentCategory = [];
  
    images.sort((a, b) => new Date(a.time) - new Date(b.time)); // Sort by time
  
    images.forEach((image, index) => {
      if (index === 0 || (new Date(image.time) - new Date(images[index - 1].time)) / 1000 > threshold) {
        // Start a new category if time difference exceeds the threshold
        if (currentCategory.length > 0) {
          categories.push(currentCategory);
        }
        currentCategory = [image];
      } else {
        currentCategory.push(image);
      }
    });
  
    // Push the last category
    if (currentCategory.length > 0) {
      categories.push(currentCategory);
    }
  
    return categories;
  };
  