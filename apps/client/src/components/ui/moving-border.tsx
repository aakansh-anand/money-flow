"use client";
import React from "react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function innerRadiusFrom(borderRadius: string) {
  return `calc(${borderRadius} * 0.96)`;
}

type TrackMetrics = {
  width: number;
  height: number;
  radius: number;
};

function readTrackMetrics(node: HTMLElement): TrackMetrics {
  const { width, height } = node.getBoundingClientRect();
  const style = getComputedStyle(node);
  const radius = Number.parseFloat(style.borderTopLeftRadius) || 0;
  return {
    width: Math.max(0, width),
    height: Math.max(0, height),
    radius: Math.max(0, radius),
  };
}

export function Button({
  borderRadius = "1.75rem",
  children,
  as: Component = "button",
  containerClassName,
  borderClassName,
  duration,
  borderPhases = [0],
  className,
  ...otherProps
}: {
  borderRadius?: string;
  children: React.ReactNode;
  //ts-ignore
  as?: React.ElementType;
  containerClassName?: string;
  borderClassName?: string;
  duration?: number;
  borderPhases?: number[];
  className?: string;
  //ts-ignore
  [key: string]: unknown;
}) {
  const innerRadius = innerRadiusFrom(borderRadius);
  const contentRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<TrackMetrics | null>(null);

  useLayoutEffect(() => {
    const node = contentRef.current;
    if (!node) {
      return;
    }

    const sync = () => {
      setMetrics(readTrackMetrics(node));
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const trackReady = metrics !== null && metrics.width > 0 && metrics.height > 0;

  return (
    <Component
      className={cn(
        "relative h-16 w-40 overflow-hidden bg-transparent p-px text-xl",
        containerClassName,
      )}
      style={{ borderRadius }}
      {...otherProps}
    >
      {trackReady ? (
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden p-0.5 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] mask-exclude"
          style={{ borderRadius: innerRadius }}
          aria-hidden
        >
          {borderPhases.map((phase, index) => (
            <MovingBorder key={index} duration={duration} metrics={metrics} phase={phase}>
              <div
                className={cn(
                  "size-20 bg-[radial-gradient(circle,rgb(14_165_233/_0.85)_0%,transparent_55%)] opacity-80",
                  borderClassName,
                )}
              />
            </MovingBorder>
          ))}
        </div>
      ) : null}

      <div
        ref={contentRef}
        className={cn(
          "relative z-1 w-full border border-slate-800 bg-slate-900/8 text-sm text-white antialiased backdrop-blur-xl",
          className,
        )}
        style={{ borderRadius: innerRadius }}
      >
        {children}
      </div>
    </Component>
  );
}

export const MovingBorder = ({
  children,
  duration = 3000,
  metrics,
  phase = 0,
}: {
  children: React.ReactNode;
  duration?: number;
  metrics: TrackMetrics;
  phase?: number;
}) => {
  const pathRef = useRef<SVGRectElement | null>(null);
  const progress = useMotionValue<number>(0);

  const cornerRadius = Math.min(metrics.radius, metrics.width / 2, metrics.height / 2);

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength();
    if (length) {
      const pxPerMillisecond = length / duration;
      progress.set((time * pxPerMillisecond + phase * length) % length);
    }
  });

  const x = useTransform(progress, (val) => {
    const point = pathRef.current?.getPointAtLength(val);
    return point?.x ?? 0;
  });
  const y = useTransform(progress, (val) => {
    const point = pathRef.current?.getPointAtLength(val);
    return point?.y ?? 0;
  });

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <div className="absolute inset-0">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute inset-0 size-full"
        viewBox={`0 0 ${metrics.width} ${metrics.height}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <rect
          ref={pathRef}
          fill="none"
          x={0}
          y={0}
          width={metrics.width}
          height={metrics.height}
          rx={cornerRadius}
          ry={cornerRadius}
        />
      </svg>
      <motion.div
        className="absolute left-0 top-0 inline-block will-change-transform"
        style={{ transform }}
      >
        {children}
      </motion.div>
    </div>
  );
};
