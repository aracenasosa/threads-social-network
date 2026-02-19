'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DiscardChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  cancelLabel?: string;
  discardLabel?: string;
}

export function DiscardChangesDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Discard changes?",
  description = "You have unsaved changes. Are you sure you want to discard them? This action cannot be undone.",
  cancelLabel = "Cancel",
  discardLabel = "Discard",
}: DiscardChangesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[340px] p-0 bg-card border-border rounded-lg overflow-hidden">
        <div className="flex flex-col items-center text-center p-6 space-y-4">
          <DialogTitle className="text-xl font-bold text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {description}
          </DialogDescription>
        </div>
        
        <div className="grid grid-cols-2 border-t border-border">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-none border-r border-border h-12 text-base font-medium text-foreground cursor-pointer"
          >
            {cancelLabel}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="rounded-none h-12 text-base font-bold text-destructive hover:text-destructive hover:bg-destructive/5 cursor-pointer"
          >
            {discardLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
