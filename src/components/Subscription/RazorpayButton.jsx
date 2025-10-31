import React, { useEffect } from 'react';

const RazorpayButton = ({ payment_button_id }) => {
  useEffect(() => {
    // Check if button already exists in the document
    const existingButton = document.querySelector(
      `[data-payment_button_id="${payment_button_id}"]`
    );
    
    if (existingButton) {
      return; // Exit if button already exists
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/payment-button.js';
    script.async = true;
    script.dataset.payment_button_id = payment_button_id;
    
    const style = document.createElement('style');
    style.innerHTML = `
      form {
        margin-top: 10px !important;
      }
      .razorpay-payment-button .PaymentButton {
        border-radius: 20px !important;
      }
      .PaymentButton-contents {
        margin-top: 0px !important;
        padding: 4px 62px !important;
      }
    `;
    
    document.head.appendChild(style);
    const form = document.getElementById(payment_button_id);
    
    if (form) {
      form.appendChild(script);
    }

    return () => {
      if (form && script.parentNode) {
        form.removeChild(script);
      }
    };
  }, [payment_button_id]);

  return <form id={payment_button_id}></form>;
};

export default RazorpayButton;