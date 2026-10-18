import React from 'react';

export default function SelectionLimitNotice({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="selection-limit-notice" data-testid="selection-limit-notice" role="alert">
      <span>{message}</span>
      {onDismiss && (
        <button className="button secondary small" onClick={onDismiss}>Dismiss</button>
      )}
    </div>
  );
}
