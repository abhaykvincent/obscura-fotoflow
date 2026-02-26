import { useState, useRef, useEffect, useCallback } from 'react';

const DEFAULT_HIDE_TIMEOUT = 3000;

/**
 * Hook to manage immersive mode (auto-hiding controls).
 * @param {boolean} initialState - Initial visibility of controls.
 * @param {number} timeout - Delay in milliseconds before hiding controls.
 */
export function useImmersiveMode(initialState = true, timeout = DEFAULT_HIDE_TIMEOUT) {
  const [showControls, setShowControls] = useState(initialState);
  const controlsTimeoutRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, timeout);
  }, [timeout, clearTimer]);

  const resetControlsTimeout = useCallback(() => {
    if (!showControls) return;
    startTimer();
  }, [showControls, startTimer]);

  const toggleControls = useCallback((e) => {
    // Prevent toggling if clicking on interactive elements
    if (e && (e.target.closest('button') || e.target.closest('.interactive'))) return;
    
    setShowControls(prev => !prev);
  }, []);

  // Handle timeout on show/hide
  useEffect(() => {
    if (showControls) {
      startTimer();
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [showControls, startTimer, clearTimer]);

  // Global mouse move listener to reset timeout
  useEffect(() => {
    const handleMouseMove = () => resetControlsTimeout();
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      clearTimer();
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [resetControlsTimeout, clearTimer]);

  return { 
    showControls, 
    setShowControls, 
    toggleControls, 
    resetControlsTimeout 
  };
}
