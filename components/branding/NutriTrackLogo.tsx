import React from "react";
import { cn } from "@/lib/utils";

export interface NutriTrackLogoProps {
  /** Size variant of the logo component */
  size?: "sm" | "md" | "lg" | "xl";
  /** Optional secondary subtitle / domain / tagline (e.g. "HEALTH OS" or "NUTRITRACK.VERCEL.APP") */
  subtitle?: string;
  /** Whether to show the subtitle text */
  showSubtitle?: boolean;
  /** Whether to render only the icon without text */
  iconOnly?: boolean;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Reusable Nutri-Track Logo Component
 * Features an outlined apple inside a rounded-square container with emerald/teal accents.
 */
export const NutriTrackLogo: React.FC<NutriTrackLogoProps> = ({
  size = "md",
  subtitle = "HEALTH OS",
  showSubtitle = true,
  iconOnly = false,
  className,
}) => {
  // Sizing definitions
  const sizeConfig = {
    sm: {
      container: "h-8 w-8 rounded-lg",
      iconSize: 18,
      title: "text-base tracking-wider",
      subtitle: "text-[9px] tracking-widest",
      gap: "gap-2.5",
    },
    md: {
      container: "h-11 w-11 rounded-xl",
      iconSize: 24,
      title: "text-xl tracking-wider",
      subtitle: "text-[11px] tracking-widest",
      gap: "gap-3.5",
    },
    lg: {
      container: "h-14 w-14 rounded-2xl",
      iconSize: 32,
      title: "text-2xl tracking-wider",
      subtitle: "text-xs tracking-widest",
      gap: "gap-4",
    },
    xl: {
      container: "h-20 w-20 rounded-3xl",
      iconSize: 46,
      title: "text-4xl tracking-wider",
      subtitle: "text-sm tracking-widest",
      gap: "gap-5",
    },
  };

  const currentSize = sizeConfig[size];

  return (
    <div className={cn("inline-flex items-center select-none", currentSize.gap, className)}>
      {/* Icon in Rounded-Square Container */}
      <div
        className={cn(
          "relative flex items-center justify-center bg-gradient-to-b from-[#0f1d18] via-[#091512] to-[#040a08] border border-emerald-500/40 shadow-brand-glow transition-all duration-300 hover:border-emerald-400 hover:shadow-brand-glow-lg shrink-0",
          currentSize.container
        )}
      >
        {/* Apple Icon SVG */}
        <svg
          width={currentSize.iconSize}
          height={currentSize.iconSize}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
        >
          {/* Apple Stem / Leaf */}
          <path
            d="M17.5 5.5C17.5 5.5 19.5 4 22 4.5C22.5 7 20.5 9 17.5 9.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Minimal Apple Outline */}
          <path
            d="M16 10.5C13.5 8.5 8 8.5 6 12C3.8 15.8 4.2 22 7.5 25.5C9.2 27.3 11.5 28 13.5 28C15 28 15.5 27.2 16 27.2C16.5 27.2 17 28 18.5 28C20.5 28 22.8 27.3 24.5 25.5C27.8 22 28.2 15.8 26 12C24 8.5 18.5 8.5 16 10.5Z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Subtle corner light highlight */}
        <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-transparent via-transparent to-emerald-400/10 pointer-events-none" />
      </div>

      {/* Typography / Branding Name */}
      {!iconOnly && (
        <div className="flex flex-col justify-center">
          <span
            className={cn(
              "font-extrabold text-foreground-primary uppercase leading-tight font-sans",
              currentSize.title
            )}
          >
            NUTRI<span className="text-emerald-400">-</span>TRACK
          </span>
          {showSubtitle && subtitle && (
            <span
              className={cn(
                "font-semibold text-emerald-400/80 uppercase font-mono mt-0.5",
                currentSize.subtitle
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default NutriTrackLogo;
