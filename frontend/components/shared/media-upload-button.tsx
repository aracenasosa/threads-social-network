'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Video } from 'lucide-react';


interface MediaUploadButtonProps {
  onFilesSelect: (files: File[]) => void;
  disabled?: boolean;
  accept?: 'image' | 'video' | 'all';
  icon?: 'image' | 'video';
}

export function MediaUploadButton({
  onFilesSelect,
  disabled = false,
  accept = 'all',
  icon = 'image',
}: MediaUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    onFilesSelect(selectedFiles);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getAcceptString = () => {
    if (accept === 'image') return 'image/*';
    if (accept === 'video') return 'video/*';
    return 'image/*,video/*';
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={getAcceptString()}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={disabled}
        className="h-9 w-9"
      >
        {icon === 'image' ? (
          <ImageIcon className="h-5 w-5" />
        ) : (
          <Video className="h-5 w-5" />
        )}
      </Button>
    </>
  );
}

