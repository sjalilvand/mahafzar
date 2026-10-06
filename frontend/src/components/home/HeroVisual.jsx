import React from "react";
import { motion } from "framer-motion";
import { Cpu } from "lucide-react";

const RINGS = [0, 1, 2, 3];

export default function HeroVisual() {
  return (
    <div className="mh-hero-visual" aria-hidden="true">
      <div className="mh-radar">
        {RINGS.map((i) => (
          <motion.span
            key={i}
            className="mh-ring"
            style={{ width: `${44 + i * 19}%`, height: `${44 + i * 19}%` }}
            animate={{ scale: [1, 1.07, 1], opacity: [0.22, 0.6, 0.22] }}
            transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.35 }}
          />
        ))}
        <motion.span
          className="mh-sweep"
          animate={{ rotate: 360 }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
        />
        <motion.span
          className="mh-dot mh-dot-a"
          animate={{ rotate: 360 }}
          transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
        ><i /></motion.span>
        <motion.span
          className="mh-dot mh-dot-b"
          animate={{ rotate: -360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        ><i /></motion.span>
        <motion.div
          className="mh-core"
          animate={{
            boxShadow: [
              "0 0 22px rgba(34,211,238,.35)",
              "0 0 55px rgba(34,211,238,.85)",
              "0 0 22px rgba(34,211,238,.35)",
            ],
          }}
          transition={{ duration: 2.4, repeat: Infinity }}
        >
          <Cpu size={44} strokeWidth={1.6} />
        </motion.div>
      </div>
    </div>
  );
}
