'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageGallery } from './ImageGallery';

interface ImageSliderProps {
  images: string[];
  hotelName: string;
}

export function ImageSlider({ images, hotelName }: ImageSliderProps) {
  // Filter out empty strings from images
  const validImages = images.filter((img): img is string => Boolean(img && img.trim()));
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Return empty state if no valid images
  if (!validImages.length) {
    return (
      <div className="bg-black w-full aspect-video rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-gray-400">No images available</div>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const handleImageClick = (index: number) => {
    setCurrentIndex(index);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Main Slider */}
        <div className="relative mb-6">
          <div 
            className="relative w-full aspect-video rounded-lg overflow-hidden bg-black cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => handleImageClick(currentIndex)}
          >
            <Image
              src={validImages[currentIndex]}
              alt={`${hotelName} - ${currentIndex + 1}`}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Navigation Buttons */}
          {validImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                onClick={prevImage}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                onClick={nextImage}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
            {currentIndex + 1} / {validImages.length}
          </div>
        </div>

        {/* Thumbnail Strip */}
        {validImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {validImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-white ring-2 ring-white'
                    : 'border-gray-600 opacity-60 hover:opacity-100'
                }`}
              >
                <Image
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Gallery (for viewing all images) */}
      <ImageGallery 
        images={validImages} 
        hotelName={hotelName}
        isOpen={lightboxOpen}
        onOpenChange={setLightboxOpen}
        initialIndex={lightboxIndex}
      />
    </div>
  );
}
