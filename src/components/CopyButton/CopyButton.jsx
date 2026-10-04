import React, { useEffect, useRef, useState } from 'react';

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

/**
 * Minimal icon copy button.
 * Shows a smooth green check for ~1.6s right after a successful copy.
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
      className={`${className}${copied ? ' copied' : ''}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick(e);
      }}
    >
      {children}
    </div>
  );
}

export { writeToClipboard };
