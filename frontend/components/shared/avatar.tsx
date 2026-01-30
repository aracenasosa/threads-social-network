'use client';

import Image from 'next/image';
import { cn } from '@/shared/lib/utils';

interface AvatarProps {
  src?: string;
  alt: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

export function Avatar({ src, alt, fallback, size = 'md', className, onClick }: AvatarProps) {
  return (
    <div 
        className={cn(
            'rounded-full bg-primary/10 overflow-hidden relative shrink-0', 
            sizeClasses[size], 
            onClick && 'cursor-pointer hover:opacity-90 transition-opacity',
            className
        )}
        onClick={onClick}
    >
      {src ? (
        <Image 
          src={src} 
          alt={alt} 
          fill 
          sizes="(max-width: 768px) 48px, 64px" 
          className="object-cover object-top" 
          quality={100} 
          priority 
          unoptimized={true}
        />
      ) : (
        <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
          {fallback[0]?.toUpperCase()}
        </div>
      )}
    </div>
  );
}

