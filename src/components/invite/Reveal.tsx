"use client";

import { motion } from "framer-motion";

export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  // Script fonts are unreadable in ALL CAPS, so fall back to the heading font.
  const caps = typeof children === "string" && /[A-Z]/.test(children) && children === children.toUpperCase();
  return (
    <div className="mb-5 text-center">
      <h2 className={`${caps ? "font-heading tracking-widest" : "font-title"} text-xl leading-relaxed`} style={{ color: "var(--primary)" }}>
        {children}
      </h2>
      <div className="divider mx-auto mt-3 w-40" />
    </div>
  );
}
