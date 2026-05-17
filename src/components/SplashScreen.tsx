'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';

interface SplashScreenProps {
  version: string;
  onClose: () => void;
}

export default function SplashScreen({ version, onClose }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      onClose();
    }, 600);
  }, [onClose]);

  // Pressing any key also dismisses
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #0a0f1a 0%, #0d1b2a 30%, #1b2d45 60%, #0a1628 100%)' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Gradient orbs */}
            <motion.div
              className="absolute w-[500px] h-[500px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(57,99,139,0.15) 0%, transparent 70%)',
                left: '10%',
                top: '20%',
              }}
              animate={{
                x: [0, 30, -20, 0],
                y: [0, -20, 30, 0],
                scale: [1, 1.1, 0.95, 1],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute w-[400px] h-[400px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(138,176,209,0.1) 0%, transparent 70%)',
                right: '5%',
                bottom: '10%',
              }}
              animate={{
                x: [0, -25, 15, 0],
                y: [0, 25, -15, 0],
                scale: [1, 0.9, 1.05, 1],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute w-[300px] h-[300px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(74,122,168,0.08) 0%, transparent 70%)',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Subtle floating lines */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-px"
                style={{
                  width: `${80 + Math.random() * 120}px`,
                  background: `linear-gradient(to right, transparent, rgba(138,176,209,${0.08 + Math.random() * 0.12}), transparent)`,
                  left: `${Math.random() * 100}%`,
                  top: `${15 + Math.random() * 70}%`,
                }}
                animate={{
                  x: [-30, 30, -30],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 6 + Math.random() * 4,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: 'easeInOut',
                }}
              />
            ))}

            {/* Tiny star-like dots */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`star-${i}`}
                className="absolute rounded-full"
                style={{
                  width: `${1 + Math.random() * 2}px`,
                  height: `${1 + Math.random() * 2}px`,
                  backgroundColor: `rgba(138,176,209,${0.2 + Math.random() * 0.4})`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0.2, 0.8, 0.2],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 3 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center px-6 max-w-md w-full">
            {/* Logo container with glow ring */}
            <motion.div
              className="relative"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Outer glow ring */}
              <motion.div
                className="absolute inset-[-16px] rounded-full"
                style={{
                  border: '1.5px solid rgba(138,176,209,0.2)',
                  boxShadow: '0 0 40px rgba(57,99,139,0.15), inset 0 0 40px rgba(57,99,139,0.05)',
                }}
                animate={{
                  scale: [1, 1.03, 1],
                  opacity: [0.6, 1, 0.6],
                  rotate: [0, 1, -1, 0],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Inner glow */}
              <motion.div
                className="absolute inset-[-4px] rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(57,99,139,0.1), rgba(138,176,209,0.05))',
                }}
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Logo image - golf ball */}
              <motion.div
                className="w-28 h-28 rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, #111827, #1e293b)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 60px rgba(57,99,139,0.1)',
                }}
                animate={{
                  boxShadow: [
                    '0 8px 32px rgba(0,0,0,0.5), 0 0 60px rgba(57,99,139,0.1)',
                    '0 8px 32px rgba(0,0,0,0.5), 0 0 80px rgba(57,99,139,0.2)',
                    '0 8px 32px rgba(0,0,0,0.5), 0 0 60px rgba(57,99,139,0.1)',
                  ],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <img
                  src="/golf-ball-logo.png"
                  alt="Jazel Golf"
                  className="w-20 h-20 object-contain"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(138,176,209,0.3))' }}
                />
              </motion.div>
            </motion.div>

            {/* App name */}
            <motion.h1
              className="mt-8 text-3xl sm:text-4xl font-bold tracking-tight text-center"
              style={{
                background: 'linear-gradient(135deg, #e2e8f0, #f8fafc, #cbd5e1)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                textShadow: 'none',
              }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              Jazel
            </motion.h1>

            {/* Slogan - split in two lines */}
            <motion.p
              className="mt-4 text-center text-sm sm:text-base leading-relaxed max-w-xs"
              style={{ color: 'rgba(148,163,184,0.9)' }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              Track every shot, share every round,
              <br />
              <span className="font-medium" style={{ color: 'rgba(138,176,209,0.95)' }}>
                rule every tournament – with Jazel's
              </span>
              <br />
              <span className="font-medium" style={{ color: 'rgba(138,176,209,0.95)' }}>
                pinpoint range finder.
              </span>
            </motion.p>

            {/* Decorative line */}
            <motion.div
              className="mt-6 h-px"
              style={{
                background: 'linear-gradient(to right, transparent, rgba(138,176,209,0.3), transparent)',
                width: '120px',
              }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Enter button */}
            <motion.button
              onClick={handleClose}
              className="mt-6 px-8 py-2.5 rounded-full text-sm font-semibold tracking-wide cursor-pointer transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(57,99,139,0.3), rgba(74,122,168,0.2))',
                border: '1px solid rgba(138,176,209,0.3)',
                color: '#8ab0d1',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{
                background: 'linear-gradient(135deg, rgba(57,99,139,0.5), rgba(74,122,168,0.4))',
                borderColor: 'rgba(138,176,209,0.5)',
                boxShadow: '0 0 20px rgba(57,99,139,0.2), 0 0 40px rgba(57,99,139,0.1)',
                scale: 1.02,
              }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="flex items-center gap-2">
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ⛳
                </motion.span>
                Enter App
              </span>
            </motion.button>

            {/* Version under button */}
            <motion.span
              className="mt-4 text-xs font-mono tracking-widest"
              style={{ color: 'rgba(100,116,139,0.5)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 1.2 }}
            >
              v{version}
            </motion.span>

            {/* Animated dots */}
            <motion.div
              className="flex gap-1.5 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 h-1 rounded-full"
                  style={{ backgroundColor: 'rgba(138,176,209,0.4)' }}
                  animate={{
                    opacity: [0.3, 0.8, 0.3],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              ))}
            </motion.div>
          </div>

          {/* Top vignette */}
          <div
            className="absolute inset-x-0 top-0 h-32 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(10,15,26,0.6), transparent)',
            }}
          />
          {/* Bottom vignette */}
          <div
            className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(10,15,26,0.6), transparent)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
