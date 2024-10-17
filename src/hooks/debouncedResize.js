import { useEffect, useState, useCallback } from 'react';

export const useDebouncedResize = (delay = 300) => {
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const updateSize = useCallback(() => {
    setScreenSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  useEffect(() => {
    const handleResize = debounce(updateSize, delay);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateSize, delay]);

  return screenSize;
};

function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
