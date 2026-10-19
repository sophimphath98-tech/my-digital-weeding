"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export function Lightbox({ src, onClose }: { src: string | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {src && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <button className="absolute right-4 top-4 text-white" aria-label="Close" onClick={onClose}>
            <X size={28} />
          </button>
          <motion.img
            src={src}
            alt=""
            className="max-h-full max-w-full rounded-lg object-contain"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
