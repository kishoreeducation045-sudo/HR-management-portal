import { useRef } from 'react';
import { motion } from 'framer-motion';
import { usePersona, PERSONAS } from '../../context/PersonaContext';

export default function PersonaSwitcher() {
  const { persona, setPersona } = usePersona();
  const containerRef = useRef(null);

  return (
    <div className="persona-switcher" ref={containerRef}>
      {Object.entries(PERSONAS).map(([key, { label, emoji }]) => {
        const isActive = persona === key;
        return (
          <button
            key={key}
            className={`persona-btn${isActive ? ' active' : ''}`}
            onClick={() => setPersona(key)}
            title={`Switch to ${label}`}
          >
            {isActive && (
              <motion.span
                className="persona-pill"
                layoutId="persona-pill"
                style={{ position: 'absolute', inset: 0, borderRadius: 20, zIndex: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>
              {emoji} {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
