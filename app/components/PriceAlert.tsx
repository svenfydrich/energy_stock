"use client";

import { useEffect, useState } from "react";

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
      .join(" || ");

    return {
      prefix: "Price Alert: ",
      content: formattedOffers,
    };
  };

  const { prefix, content } = getDisplayContent();

  return (
    <div className="relative w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden py-2 z-40">
      <div className="flex">
        <div className="animate-marquee whitespace-nowrap">
          <span className="text-sm px-4">
            <span className="font-bold">{prefix}</span>
            {content && <span className="font-medium">{content}</span>}
          </span>
        </div>
      </div>
    </div>
  );
}
