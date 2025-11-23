"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Offer {
  title: string;
  price: string;
}

export function AnimatedBar() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchOffers = async () => {
//       try {
//         const response = await fetch(
//           "https://raw.githubusercontent.com/svenfydrich/price_alert_scraper/main/data/offers.json"
//         );
//         if (!response.ok) {
//           throw new Error("Failed to fetch offers");
//         }
//         const data = await response.json();
//         setOffers(data);
//       } catch (err) {
//         setError(err instanceof Error ? err.message : "Failed to fetch offers");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchOffers();
//     const interval = setInterval(fetchOffers, 100 * 60 * 1000);

//     return () => clearInterval(interval);
//   }, []);

//   if (isLoading || error) {
//     return null;
//   }

  const getDisplayContent = () => {
    if (offers.length === 0) {
      return { prefix: "", content: "" };
    }
    // Uncomment and adjust below if you want to show offers
    // const formattedOffers = offers
    //   .map((offer) => `${offer.title}: ${offer.price}`)
    //   .join(" // ");
    // return { prefix: "!!! Price Alert: ", content: formattedOffers };
    return { prefix: "", content: "" };
  };

  const display = getDisplayContent() || { prefix: "", content: "" };
  const { prefix, content } = display;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        transition={{
          type: "spring",
          stiffness: 80,
          damping: 18,
          mass: 1.5,
        }}
        className="relative w-full overflow-hidden py-1"
      >
        {/* Animated Background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #32de84, #229e5c, #6fffc2, #eafff4, #32de84, #229e5c, #6fffc2, #32de84)",
            backgroundSize: "200% 100%",
            animation: "gradient-flow 4s linear infinite",
          }}
        />

        {/* Shimmer Effect */}
        <motion.div
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 1,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 1,
          }}
          className="absolute inset-0 bg-linear-to-r from-transparent via-[#eafff4]/40 to-transparent transform skew-x-12"
        />

        <div className="relative flex items-center text-black whitespace-nowrap">
          <div className="flex items-center text-sm mobile:text-xs mobile: mobile: w-full">
            {/* Pulsing Prefix */}
            <motion.span
              animate={{
                scale: [2, 0, 1],
                textShadow: [
                  "0 0 0px rgba(255,255,255,0)",
                  "0 0 10px rgba(255,255,255,0.5)",
                  "0 0 0px rgba(255,255,255,0)",
                ],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="font-bold shrink-0"
            >
              {prefix}
            </motion.span>

            {/* Sliding Content */}
            {content && (
              <motion.div
                key={content}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 10,
                  delay: 1,
                }}
                className="ml-2 mobile:ml-1 font-extralight overflow-hidden flex-1 min-w-0"
              >
                <motion.span
                  animate={
                    content.length > 100
                      ? {
                          x: [0, -50, 0],
                        }
                      : {}
                  }
                  transition={
                    content.length > 10
                      ? {
                          duration: 1,
                          ease: "linear",
                          repeat: Infinity,
                        }
                      : {}
                  }
                  className="inline-block"
                >
                  {content}
                </motion.span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Glowing Border Effect */}
        <motion.div
          animate={{
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 border-t-2 border-b-2 border-white/30"
        />
      </motion.div>
    </AnimatePresence>
  );
}
