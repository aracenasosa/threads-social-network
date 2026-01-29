'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PostMedia } from '@/shared/types/post.types';
import { cn } from '@/shared/lib/utils';

interface PostMediaGridProps extends React.HTMLAttributes<HTMLDivElement> {
  media: PostMedia[];
  className?: string;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  isFullScreen?: boolean;
  onMediaClick?: (index: number) => void;
}

export function PostMediaGrid({
  media,
  className,
  activeIndex = 0,
  onActiveIndexChange,
  isFullScreen = false,
  onMediaClick,
  ...rest
}: PostMediaGridProps) {
  if (!media || media.length === 0) return null;

  const isSingleItem = media.length === 1;
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: !isFullScreen,
    skipSnaps: false,
    startIndex: isFullScreen ? activeIndex : 0,
  });

  // Update scroll button states
  const updateScrollButtons = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  // Scroll to active index when it changes in fullscreen
  useEffect(() => {
    if (emblaApi && isFullScreen) {
      emblaApi.scrollTo(activeIndex, false);
    }
  }, [emblaApi, activeIndex, isFullScreen]);

  // Handle slide change in fullscreen mode
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    updateScrollButtons();
    if (isFullScreen && onActiveIndexChange) {
      const index = emblaApi.selectedScrollSnap();
      onActiveIndexChange(index);
    }
  }, [emblaApi, isFullScreen, onActiveIndexChange, updateScrollButtons]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    emblaApi.on('init', updateScrollButtons);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('init', updateScrollButtons);
    };
  }, [emblaApi, onSelect, updateScrollButtons]);

  // Navigation handlers
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Handle click - check if it was a drag or a click
  const handleClick = useCallback((index: number) => {
    if (!emblaApi) return;
    const engine = emblaApi.internalEngine();
    if (engine.dragHandler.pointerDown()) return;
    onMediaClick?.(index);
  }, [emblaApi, onMediaClick]);

  return (
    <div
      className={cn(
        'mt-3 rounded-xl overflow-hidden relative',
        isFullScreen && 'mt-0 rounded-none',
        className,
      )}
      {...rest}
    >
      {/* Embla Carousel Container */}
      <div ref={emblaRef} className="overflow-hidden cursor-grab active:cursor-grabbing">
        <div className={cn('flex', !isFullScreen && 'gap-1')}>
          {media.map((item, index) => {
            const isVideo = item.type === 'video';

            return (
              <div
                key={index}
                className={cn(
                  'relative shrink-0 rounded-lg overflow-hidden',
                  !isFullScreen && isSingleItem && 'w-full aspect-square',
                  !isFullScreen && !isSingleItem && index === 0 && 'w-[55%] aspect-square',
                  !isFullScreen && !isSingleItem && index > 0 && 'w-[40%] aspect-square',
                  isFullScreen && 'w-full aspect-square'
                )}
                onClick={() => handleClick(index)}
              >
                {isVideo ? (
                  <video
                    src={item.url}
                    controls={isFullScreen}
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover pointer-events-none select-none"
                    draggable={false}
                  />
                ) : (
                  <Image
                    src={item.url}
                    alt={`Post content ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                    className="object-cover pointer-events-none select-none"
                    draggable={false}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation arrows - only in fullscreen and when multiple items */}
      {isFullScreen && !isSingleItem && (
        <>
          {/* Left arrow */}
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 z-10',
              'w-10 h-10 rounded-full bg-black/60 flex items-center justify-center',
              'text-white transition-opacity hover:bg-black/80',
              !canScrollPrev && 'opacity-30 cursor-not-allowed'
            )}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right arrow */}
          <button
            onClick={scrollNext}
            disabled={!canScrollNext}
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 z-10',
              'w-10 h-10 rounded-full bg-black/60 flex items-center justify-center',
              'text-white transition-opacity hover:bg-black/80',
              !canScrollNext && 'opacity-30 cursor-not-allowed'
            )}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
    </div>
  );
}
