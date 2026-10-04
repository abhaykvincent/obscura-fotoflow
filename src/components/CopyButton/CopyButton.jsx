import React, { useEffect, useRef, useState } from 'react';
import './CopyButton.scss';

async function writeToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts / older browsers
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

const CopySvg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const CheckSvg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

/**
 * Minimal icon copy button.
 * Shows a smooth green check crossfade right after a successful copy.
 *
 * Usage:
 *   <CopyButton text={url} className="button primary outline text-only icon copy" />
 *   <CopyButton text={code} className="button icon copy">{code}</CopyButton>
 */
export default function CopyButton({
  text = '',
  className = 'button primary outline text-only icon copy',
  title = 'Copy',
  children = null,
  resetAfter = 1600,
  onCopied = null,
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = async (e) => {
    e.stopPropagation();
    if (!text) return;
    const ok = await writeToClipboard(text);
    if (!ok) return;
    setCopied(true);
    if (onCopied) onCopied();
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), resetAfter);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={copied ? 'Copied' : title}
      title={copied ? 'Copied!' : title}
      className={`${className} copy-feedback${copied ? ' copied' : ''}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick(e);
      }}
    >
      <span className="copy-anim" aria-hidden="true">
        <span className="copy-anim-icon copy-anim-copy">
          <CopySvg />
        </span>
        <span className="copy-anim-icon copy-anim-check">
          <CheckSvg />
        </span>
      </span>
      {children != null && children !== '' && (
        <span className="copy-label">{children}</span>
      )}
    </div>
  );
}

export { writeToClipboard };
