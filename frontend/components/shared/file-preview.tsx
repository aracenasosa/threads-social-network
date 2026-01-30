'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { X, Video } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  className?: string;
}

export function FilePreview({ file, onRemove, className }: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const isImage = file.type.startsWith('image/');

  return (
    <div className={cn('relative group', className)}>
      {isImage ? (
        <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
          {previewUrl && (
            <Image
              src={previewUrl}
              alt={`Preview ${file.name}`}
              fill
              sizes="(max-width: 768px) 100vw, 200px"
              className="object-cover"
            />
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted flex items-center justify-center">
          {previewUrl ? (
            <video
              src={previewUrl}
              className="w-full h-full object-cover"
              muted
              autoPlay
              loop
              playsInline
            />
          ) : (
            <Video className="h-12 w-12 text-muted-foreground" />
          )}
          <div className="absolute top-2 right-2">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

