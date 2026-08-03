"use client";

import { useRef } from "react";

import { useSpecularShine } from "@/components/ui/useSpecularShine";
import "@/components/ui/specular-button.css";

/**
 * SpecularButton (React Bits, JS+CSS variant, adapted to TypeScript): a
 * pill/rounded-rect button whose border catches a moving WebGL specular
 * highlight that follows the pointer. Used for the Hero's primary CTAs
 * ("Download Resume", "Get in Touch") per the design pass's button-upgrade
 * request. See https://github.com/DavidHDev/react-bits (MIT).
 *
 * The actual shader/animation loop lives in `useSpecularShine.ts`, shared
 * with `ExploreMoreButton` so both a real button/anchor and a `next/link`
 * control get the identical hover shine rather than one of them shipping
 * the CSS classes with no effect mounted behind them.
 */
export type SpecularButtonSize = "sm" | "md" | "lg";

export interface SpecularButtonProps {
  children?: React.ReactNode;
  size?: SpecularButtonSize;
  radius?: number;
  tint?: string;
  tintOpacity?: number;
  blur?: number;
  textColor?: string;
  lineColor?: string;
  baseColor?: string;
  intensity?: number;
  shineSize?: number;
  shineFade?: number;
  thickness?: number;
  speed?: number;
  followMouse?: boolean;
  proximity?: number;
  autoAnimate?: boolean;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  className?: string;
  type?: "button" | "submit" | "reset";
  /**
   * When set, renders a real `<a>` instead of a `<button>` — the shine effect
   * and geometry are identical either way. Used for real navigation targets
   * (resume download, `mailto:` CTA) so the correct anchor semantics
   * (`download`, right-click "copy link", etc.) are preserved.
   */
  href?: string;
  download?: boolean;
  target?: string;
  rel?: string;
  "aria-label"?: string;
}

export default function SpecularButton({
  children = "Get Started",
  size = "lg",
  radius = 18,
  tint = "#ffffff",
  tintOpacity = 0,
  blur = 0,
  textColor = "#f5f5f5",
  lineColor = "#ffffff",
  baseColor = "#525252",
  intensity = 1,
  shineSize = 10,
  shineFade = 40,
  thickness = 1,
  speed = 0.35,
  followMouse = true,
  proximity = 250,
  autoAnimate = false,
  disabled = false,
  onClick,
  className = "",
  type = "button",
  href,
  download,
  target,
  rel,
  ...rest
}: SpecularButtonProps) {
  const btnRef = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  const fxRef = useRef<HTMLSpanElement>(null);

  useSpecularShine(btnRef, fxRef, {
    radius,
    lineColor,
    baseColor,
    intensity,
    shineSize,
    shineFade,
    thickness,
    speed,
    followMouse,
    proximity,
    autoAnimate,
  });

  const style = {
    "--sb-radius": `${radius}px`,
    "--sb-tint": tint,
    "--sb-tint-opacity": tintOpacity,
    "--sb-blur": `${blur}px`,
    "--sb-text-color": textColor,
  } as React.CSSProperties;
  const sharedClassName = `specular-button specular-button--${size}${className ? ` ${className}` : ""}`;

  if (href) {
    return (
      <a
        ref={btnRef}
        href={href}
        download={download}
        target={target}
        rel={rel}
        onClick={onClick as React.MouseEventHandler<HTMLAnchorElement>}
        className={sharedClassName}
        style={style}
        {...rest}
      >
        <span ref={fxRef} className="specular-button__fx" aria-hidden="true" />
        <span className="specular-button__label">{children}</span>
      </a>
    );
  }

  return (
    <button
      ref={btnRef}
      type={type}
      disabled={disabled}
      onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
      className={sharedClassName}
      style={style}
      {...rest}
    >
      <span ref={fxRef} className="specular-button__fx" aria-hidden="true" />
      <span className="specular-button__label">{children}</span>
    </button>
  );
}
