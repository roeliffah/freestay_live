'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface ImageGalleryProps {
  images: string[];
  hotelName: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialIndex?: number;
}

export function ImageGallery({ images, hotelName, isOpen: externalOpen, onOpenChange, initialIndex = 0 }: ImageGalleryProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const openGallery = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Show all images if more than 3
  if (images.length <= 3) {
    return null;
  }

  return (
    <>
      {/* Gallery Trigger - Hidden, triggered from slider */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black">
          <VisuallyHidden>
            <DialogTitle>Hotel Image Gallery</DialogTitle>
          </VisuallyHidden>
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Previous Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 z-50 text-white hover:bg-white/20"
              onClick={prevImage}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>

            {/* Main Image */}
            <div className="relative w-full h-full">
              <Image
                src={images[currentIndex]}
                alt={`${hotelName} - ${currentIndex + 1}`}
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Next Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 z-50 text-white hover:bg-white/20"
              onClick={nextImage}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
              {currentIndex + 1} / {images.length}
            </div>

            {/* Thumbnail Strip */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide justify-center">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                      index === currentIndex
                        ? 'border-white scale-110'
                        : 'border-transparent opacity-60 hover:opacity-100'
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
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
