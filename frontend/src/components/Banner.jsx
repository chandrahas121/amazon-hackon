import React from "react";
import { Carousel } from "react-responsive-carousel";
import { useNavigate } from "react-router-dom";
import "react-responsive-carousel/lib/styles/carousel.min.css";

const SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1500&h=500&fit=crop",
    title: "Shop AI-Verified Pre-Loved Electronics",
    subtitle: "Same trust. Lower price. Better for the planet.",
    cta: "Shop Revive Electronics",
    source: "p2p",
  },
  {
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1500&h=500&fit=crop",
    title: "List Your Items in Minutes",
    subtitle: "Take photos, set your price, drop off at any Amazon Locker.",
    cta: "Start Selling",
    link: "/sell",
  },
  {
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1500&h=500&fit=crop",
    title: "Earn Green Credits on Every Order",
    subtitle: "Keep your delivery. Skip the return. Earn credits, save CO₂.",
    cta: "Browse Renewed Items",
    source: "renewed",
  },
];

const Banner = () => {
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Bottom fade into page background */}
      <div className="absolute w-full h-16 sm:h-24 bg-gradient-to-t from-gray-100 to-transparent bottom-0 z-20 pointer-events-none" />

      <Carousel
        autoPlay
        infiniteLoop
        showStatus={false}
        showIndicators
        showThumbs={false}
        interval={4000}
        swipeable
      >
        {SLIDES.map((slide, i) => (
          <div key={i} className="relative">
            <img
              loading="lazy"
              src={slide.image}
              alt={slide.title}
              className="w-full object-cover h-44 sm:h-64 md:h-80 lg:h-[360px]"
            />
            {/* Text overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent flex items-center z-10">
              <div className="text-left px-4 sm:px-8 md:px-12 max-w-xs sm:max-w-md">
                <h2 className="text-white text-base sm:text-xl md:text-2xl lg:text-3xl font-bold leading-snug mb-1 sm:mb-2 drop-shadow">
                  {slide.title}
                </h2>
                <p className="text-gray-200 text-xs sm:text-sm mb-3 sm:mb-4 drop-shadow hidden sm:block">
                  {slide.subtitle}
                </p>
                <button
                  onClick={() =>
                    slide.link
                      ? navigate(slide.link)
                      : navigate(slide.source ? `/?source=${slide.source}` : '/')
                  }
                  className="bg-[#febd69] hover:bg-[#f3a847] text-[#131921] font-bold px-3 py-1.5 sm:px-5 sm:py-2 rounded text-xs sm:text-sm transition-colors"
                >
                  {slide.cta}
                </button>
              </div>
            </div>
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default Banner;
