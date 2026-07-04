import * as React from "react";
import { cn } from "@/lib/utils";

export const Slider = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="range"
      className={cn(
        "w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer",
        "accent-primary",
        className
      )}
      {...props}
    />
  )
);
Slider.displayName = "Slider";
