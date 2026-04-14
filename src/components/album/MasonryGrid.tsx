"use client";

import { useState } from "react";
import type { Photo } from "@/lib/albums";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

interface MasonryGridProps {
  photos: Photo[];
}

export default function MasonryGrid({ photos }: MasonryGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const slides = photos.map((photo) => ({
    src: photo.src,
    alt: photo.caption,
  }));

  return (
    <>
      <div className="masonry-grid">
        {photos.map((photo, index) => (
          <div
            key={index}
            className="group cursor-pointer overflow-hidden rounded-warm"
            onClick={() => {
              setLightboxIndex(index);
              setLightboxOpen(true);
            }}
          >
            <div className="relative">
              <img
                src={photo.src}
                alt={photo.caption}
                className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              {/* 悬浮标题 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                <span className="text-white text-sm font-medium drop-shadow-md">
                  {photo.caption}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={slides}
        plugins={[Zoom]}
        carousel={{ finite: true }}
        animation={{ fade: 300 }}
        styles={{
          container: { backgroundColor: "rgba(26, 22, 17, 0.95)" },
        }}
      />
    </>
  );
}
