"use client";

import { motion } from "framer-motion";

export function SignOutSplash() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#08080a] px-6 text-zinc-100 backdrop-blur-md"
    >
      {/* Brand mark with subtle pulse */}
      <div className="relative mb-6 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-6 rounded-full bg-[#d4af37]/20 blur-2xl"
        />
        <img
          src="/da-mark.png"
          alt="Proton Re-Link"
          className="relative h-12 w-24 object-contain"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.25 }}
        className="flex flex-col items-center text-center"
      >
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Signing you out
        </h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-xs leading-relaxed">
          Closing command session and securing your vehicle connection…
        </p>
      </motion.div>

      {/* Animated glowing progress indicator */}
      <div className="relative mt-7 h-1 w-52 overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
          className="h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-[#d4af37] to-transparent"
        />
      </div>
    </motion.div>
  );
}
