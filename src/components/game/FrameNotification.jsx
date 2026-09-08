import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function FrameNotification({ message, type = 'error', onDismiss, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isError = type === 'error';
  const borderColor = isError ? '#ff4444' : '#5aaa5f';
  const bgColor = isError ? '#2a1a1f' : '#1a2a1f';
  const innerBg = isError ? '#1a1015' : '#0f1f15';
  const textColor = isError ? '#ff8888' : '#a8e8ad';
  const glowColor = isError ? '#ff4444' : '#5aaa5f';

  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="fixed z-[6]"
      style={{
        top: 'calc(var(--content-pad-top) + 10px)',
        left: 'var(--content-pad-left)',
        right: 'var(--content-pad-right)',
      }}
    >
      <div className="relative" style={{ border: `2px solid ${borderColor}`, backgroundColor: bgColor, boxShadow: `0 0 12px ${glowColor}66, inset 0 0 0 1px ${innerBg}` }}>
        <div className="absolute inset-[3px]" style={{
          backgroundColor: innerBg,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(90,122,95,0.08) 1px, transparent 0)',
          backgroundSize: '3px 3px',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)'
        }}></div>
        <div className="relative px-4 py-3 text-center">
          <div className="font-bold text-sm tracking-wide" style={{ color: textColor, textShadow: `0 0 8px ${glowColor}88` }}>
            {message}
          </div>
        </div>
      </div>
    </motion.div>
  );
}