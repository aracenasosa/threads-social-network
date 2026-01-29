'use client';

import Image from 'next/image';
import { cn } from '@/shared/lib/utils';

interface AvatarProps {
  src?: string;
  alt: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

export function Avatar({ src, alt, fallback, size = 'md', className }: AvatarProps) {
  return (
    <div className={cn('rounded-full bg-primary/10 overflow-hidden relative shrink-0', sizeClasses[size], className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes="48px" className="object-cover" />
      ) : (
        <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
          {fallback[0]?.toUpperCase()}
        </div>
      )}
    </div>
  );
}

