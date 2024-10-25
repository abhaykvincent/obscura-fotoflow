import { useEffect, useRef } from "react";

export const useModalFocus = (isOpen) => {
    const modalRef = useRef(null);
  
    useEffect(() => {
      if (isOpen) {
        // Short timeout to ensure DOM is ready
        setTimeout(() => {
          const modal = modalRef.current;
          if (modal) {
            // Find first focusable element
            const focusableElement = modal.querySelector(
              'input, select, textarea, button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
            );
            if (focusableElement) {
              focusableElement.focus();
            }
          }
        }, 50);
      }
    }, [isOpen]);
  
    return modalRef;
  };