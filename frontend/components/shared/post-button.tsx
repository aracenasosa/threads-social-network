import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import React from "react";

interface PostButtonProps extends React.ComponentProps<typeof Button> {
  children?: React.ReactNode;
}

export function PostButton({ className, children = "Post", ...props }: PostButtonProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "cursor-pointer border border-zinc-300 dark:border-zinc-600 bg-transparent text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors",
        props.disabled && "cursor-not-allowed opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
