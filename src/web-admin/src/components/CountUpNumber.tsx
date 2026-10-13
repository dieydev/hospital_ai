import React, { useState, useEffect, useRef } from 'react';

interface CountUpNumberProps {
  end: number;
  duration?: number; // milliseconds
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * CountUpNumber Component - Smooth 60fps counter animation using IntersectionObserver & requestAnimationFrame.
 * Starts counting as soon as the element scrolls into the viewport.
 */
export const CountUpNumber: React.FC<CountUpNumberProps> = ({
  end,
  duration = 2000,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  style = {},
}) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const node = elementRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setHasStarted(true);
      return;
    }

    // Trigger counting animation when scrolled into viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number | null = null;
    let animationFrameId: number;

    // Decelerating exponential easing for natural speed-up then gentle settle
    const easeOutExpo = (t: number): number => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    };

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutExpo(progress);

      const currentVal = easedProgress * end;
      setCount(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [hasStarted, end, duration]);

  const formattedValue =
    decimals > 0
      ? count.toFixed(decimals)
      : Math.floor(count).toLocaleString('vi-VN');

  return (
    <span ref={elementRef} className={className} style={style}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
};
