"use client";

import { motion } from "framer-motion";
import SearchBar from "@/components/SearchBar";

const floatingChips = [
  { label: "Gloves", emoji: "🧤", href: "/shop?category=gloves" },
  { label: "Masks", emoji: "😷", href: "/shop?category=masks" },
  { label: "Sanitizers", emoji: "🧴", href: "/shop?category=sanitizers" },
  { label: "First Aid", emoji: "🩹", href: "/shop?category=first-aid" },
];

export default function HeroEnhancement() {
  const searchPlaceholder = "Search among 9,000+ trusted medical products…";

  return (
    <div className="relative py-8 md:py-12" suppressHydrationWarning>
      {/* Animated Headline */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center mb-6"
        suppressHydrationWarning
      >
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-3xl md:text-5xl font-bold text-gray-900 mb-3"
          suppressHydrationWarning
        >
          Premium Medical Supplies
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto"
          suppressHydrationWarning
        >
          Trusted healthcare solutions delivered to your door
        </motion.p>
      </motion.div>

      {/* Enhanced Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="max-w-2xl mx-auto mb-8"
        suppressHydrationWarning
      >
        <div className="relative" suppressHydrationWarning>
          <SearchBar className="w-full" />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute -bottom-6 left-0 right-0 text-center"
            suppressHydrationWarning
          >
            <p className="text-xs text-gray-500">{searchPlaceholder}</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Floating Category Chips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="flex flex-wrap justify-center gap-3 px-4"
        suppressHydrationWarning
      >
        {floatingChips.map((chip, index) => (
          <motion.a
            key={chip.label}
            href={chip.href}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.6 + index * 0.1,
              type: "spring",
              stiffness: 200,
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md transition-all text-sm font-medium text-gray-700 hover:text-teal-700"
            suppressHydrationWarning
          >
            <span className="text-lg">{chip.emoji}</span>
            <span>{chip.label}</span>
          </motion.a>
        ))}
      </motion.div>
    </div>
  );
}

