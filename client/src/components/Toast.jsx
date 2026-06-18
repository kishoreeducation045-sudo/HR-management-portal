import { AnimatePresence, motion } from 'framer-motion';

export default function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            className={`toast${t.isError ? ' error' : ''}`}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {t.isError ? '❌' : '✅'} {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
