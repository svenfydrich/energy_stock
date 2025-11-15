"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Offer {
  title: string;
  price: string;
}

export function PriceAlert() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await fetch(
          "https://raw.githubusercontent.com/svenfydrich/price_alert_scraper/main/data/offers.json"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch offers");
        }
        const data = await response.json();
        setOffers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch offers");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffers();
    const interval = setInterval(fetchOffers, 100 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading || error) {
    return null;
  }

  const getDisplayContent = () => {
    if (offers.length === 0) {
      return {
        prefix: "Currently no special offers available.",
        content: "",
      };
    }

    const formattedOffers = offers
      .map((offer) => `${offer.title}: ${offer.price}`)
      .join(" // ");

    return {
      prefix: "!!! Price Alert: ",
      content: formattedOffers,
    };
  };

  const { prefix, content } = getDisplayContent();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
          mass: 0.8,
        }}
        className="relative w-full overflow-hidden py-1 mobile:py-0.5 z-40"
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
            duration: 3,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 2,
          }}
          className="absolute inset-0 bg-linear-to-r from-transparent via-[#eafff4]/40 to-transparent transform skew-x-12"
        />

        <div className="relative flex items-center text-black whitespace-nowrap">
          <div className="flex items-center text-sm mobile:text-xs p-2 mobile:px-1 mobile:py-0.5 w-full">
            {/* Pulsing Prefix */}
            <motion.span
              animate={{
                scale: [1, 1.05, 1],
                textShadow: [
                  "0 0 0px rgba(255,255,255,0)",
                  "0 0 10px rgba(255,255,255,0.5)",
                  "0 0 0px rgba(255,255,255,0)",
                ],
              }}
              transition={{
                duration: 2,
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
                  damping: 30,
                  delay: 0.2,
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
                    content.length > 100
                      ? {
                          duration: 15,
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
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 border-t-2 border-b-2 border-white/30"
        />
      </motion.div>
    </AnimatePresence>
  );
}
