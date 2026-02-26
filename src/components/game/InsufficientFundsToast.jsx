import React, { useEffect, useState } from 'react';

// `trigger` is a number that increments each time the toast should show
export default function InsufficientFundsToast({ trigger, message = 'INSUFFICIENT FUNDS' }) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    setVisible(true);
    setFading(false);
    const fadeTimer = setTimeout(() => setFading(true), 1400);
    const hideTimer = setTimeout(() => setVisible(false), 1900);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [trigger]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 9999 }}
    >
      <div
        style={{
          transition: 'opacity 0.5s ease',
          opacity: fading ? 0 : 1,
          background: 'linear-gradient(135deg, #2a1200, #1a0a00)',
          border: '2px solid #d85a00',
          boxShadow: '0 0 20px rgba(216, 90, 0, 0.6), inset 0 0 10px rgba(216, 90, 0, 0.2)',
          padding: '10px 28px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--ui-font)',
            fontSize: '1.2rem',
            letterSpacing: '0.1em',
            color: '#ff8c3a',
            textShadow: '0 0 10px rgba(255, 140, 58, 0.8)',
          }}
        >
          {message}
        </span>
      </div>
    </div>
  );
}