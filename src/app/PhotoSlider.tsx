"use client";
import { useState } from "react";


// 5 images: 2 real, 3 visually distinct placeholders
const images = [
  {
    url: "https://omkargroup.in/admin/gallery/24-12-2024-17350352360.jpg",
    alt: "Pramukh Omkar Rivanta 2 - Gallery Image 1"
  },
  {
    url: "https://omkargroup.in/admin/layouts/22-01-2025-17375674770.jpg",
    alt: "Pramukh Omkar Rivanta 2 - Gallery Image 2"
  },
  {
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    alt: "Placeholder Modern Building 1"
  },
  {
    url: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80",
    alt: "Placeholder Modern Building 2"
  },
  {
    url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    alt: "Placeholder Modern Building 3"
  }
];

export default function PhotoSlider() {
  const [current, setCurrent] = useState(0);
  const next = () => setCurrent((c) => (c + 1) % images.length);
  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);

  return (
    <div className="relative w-full h-80 flex items-center justify-center bg-black rounded-xl overflow-hidden shadow-lg">
      <button
        onClick={prev}
        className="absolute left-2 z-10 bg-white/70 hover:bg-white text-indigo-700 rounded-full w-10 h-10 flex items-center justify-center shadow"
        aria-label="Previous image"
      >
        &#8592;
      </button>
      <img
        src={images[current].url}
        alt={images[current].alt}
        className="object-contain w-full h-80 transition-all duration-700 ease-in-out rounded-xl bg-black"
        style={{ boxShadow: "0 4px 24px #0008", backgroundColor: '#000' }}
      />
      <button
        onClick={next}
        className="absolute right-2 z-10 bg-white/70 hover:bg-white text-indigo-700 rounded-full w-10 h-10 flex items-center justify-center shadow"
        aria-label="Next image"
      >
        &#8594;
      </button>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, idx) => (
          <span
            key={idx}
            className={`block w-3 h-3 rounded-full border border-white ${idx === current ? "bg-indigo-500" : "bg-white/60"}`}
          />
        ))}
      </div>
    </div>
  );
}
