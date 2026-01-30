'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
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
    dragFree: !isFullScreen,
    align: isFullScreen ? 'center' : 'start',
    containScroll: isFullScreen ? false : 'trimSnaps',
    startIndex: activeIndex,
    loop: isFullScreen,
  });

  // Track active slide index
  useEffect(() => {
    if (!emblaApi || !onActiveIndexChange) return;

    const onSelect = () => {
      const index = emblaApi.selectedScrollSnap();
      onActiveIndexChange(index);
    };

    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onActiveIndexChange]);

  // Sync with activeIndex prop (for opening to correct slide)
  useEffect(() => {
    if (emblaApi && activeIndex !== undefined) {
      const currentIndex = emblaApi.selectedScrollSnap();
      if (currentIndex !== activeIndex) {
        emblaApi.scrollTo(activeIndex, true);
      }
    }
  }, [emblaApi, activeIndex, isFullScreen]);

  // Update scroll button states
  const updateScrollButtons = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

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
        isFullScreen && 'mt-0 rounded-none w-screen h-screen flex flex-col items-center justify-center bg-black',
        className,
      )}
      {...rest}
    >
      {/* Embla Carousel Container */}
      <div ref={emblaRef} className="overflow-hidden h-full w-full">
        <div className={cn('flex h-full w-full', !isFullScreen && 'gap-1')}>
          {media.map((item, index) => (
            <MediaItem
              key={index}
              item={item}
              index={index}
              isActive={isFullScreen ? index === activeIndex : index === 0}
              isSingleItem={isSingleItem}
              isFullScreen={isFullScreen}
              onClick={() => handleClick(index)}
            />
          ))}
        </div>
      </div>

      {/* Navigation arrows - only when multiple items */}
      {!isSingleItem && (
        <>
          {/* Left arrow */}
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 z-10',
              'w-12 h-12 rounded-full flex items-center justify-center',
              'text-white/70 transition-all hover:text-white hover:bg-white/10',
              !canScrollPrev && 'opacity-0 pointer-events-none',
              !isFullScreen && 'w-8 h-8 bg-black/40'
            )}
          >
            <ChevronLeft className={cn("w-8 h-8", !isFullScreen && "w-5 h-5")} />
          </button>

          {/* Right arrow */}
          <button
            onClick={scrollNext}
            disabled={!canScrollNext}
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 z-10',
              'w-12 h-12 rounded-full flex items-center justify-center',
              'text-white/70 transition-all hover:text-white hover:bg-white/10',
              !canScrollNext && 'opacity-0 pointer-events-none',
              !isFullScreen && 'w-8 h-8 bg-black/40'
            )}
          >
            <ChevronRight className={cn("w-8 h-8", !isFullScreen && "w-5 h-5")} />
          </button>
        </>
      )}
    </div>
  );
}

interface MediaItemProps {
  item: PostMedia;
  index: number;
  isActive: boolean;
  isSingleItem: boolean;
  isFullScreen: boolean;
  onClick: () => void;
}

function MediaItem({ item, index, isActive, isSingleItem, isFullScreen, onClick }: MediaItemProps) {
  const isVideo = item.type === 'video';
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isVideo && videoRef.current) {
      if (isActive) {
        // Only autoplay the first video in feed, but always play when active in fullscreen
        if (isFullScreen || index === 0) {
          videoRef.current.play().catch(() => {
              // Handle autoplay block
          });
        }
      } else {
        videoRef.current.pause();
        if (isFullScreen) {
          videoRef.current.currentTime = 0;
        }
      }
    }
  }, [isActive, isVideo, isFullScreen, index]);

  return (
    <div
      className={cn(
        'relative shrink-0 flex items-center justify-center overflow-hidden',
        !isFullScreen && isSingleItem && 'w-full aspect-square rounded-lg',
        !isFullScreen && !isSingleItem && index === 0 && 'w-[55%] aspect-square rounded-lg',
        !isFullScreen && !isSingleItem && index > 0 && 'w-[40%] aspect-square rounded-lg',
        isFullScreen && 'basis-full grow-0 min-w-0 h-full'
      )}
      onClick={onClick}
    >
      {isVideo ? (
        <video
          ref={videoRef}
          src={item.url}
          controls={isFullScreen}
          muted={!isFullScreen}
          loop={!isFullScreen}
          playsInline
          preload="metadata"
          className={cn(
            "w-full h-full select-none",
            isFullScreen ? "object-contain" : "object-cover pointer-events-none"
          )}
          draggable={false}
        />
      ) : (
        <div className="relative w-full h-full">
           <Image
            src={item.url}
            alt={`Post content ${index + 1}`}
            fill
            sizes={isFullScreen ? "100vw" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"}
            className={cn(
                "pointer-events-none select-none",
                isFullScreen ? "object-contain" : "object-cover"
            )}
            draggable={false}
            priority={isFullScreen && isActive}
          />
        </div>
      )}
    </div>
  );
}

