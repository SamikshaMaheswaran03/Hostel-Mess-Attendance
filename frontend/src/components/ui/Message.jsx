import { AnimatePresence, motion } from 'framer-motion'

export function Message({ text, type = 'success' }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.div
          key={text}
          className={`message message-${type}`}
          role="status"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
