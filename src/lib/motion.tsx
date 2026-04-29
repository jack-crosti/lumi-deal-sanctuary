import {
  ReactNode,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

/**
 * Returns true if the user prefers reduced motion. Reactive to OS changes.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

interface RevealProps {
  children: ReactNode;
  /** Tailwind className applied to the wrapper. */
  className?: string;
  /** Stagger delay in ms. */
  delay?: number;
  /** Movement direction; default "up". */
  from?: "up" | "down" | "left" | "right" | "none";
  /** Distance in px (default 24). */
  distance?: number;
  /** Re-trigger when re-entering viewport. */
  once?: boolean;
  /** Render as a different element. */
  as?: "div" | "section" | "li" | "span";
  /** Inline style passthrough. */
  style?: CSSProperties;
}

/**
 * Lightweight scroll-triggered reveal. Honors prefers-reduced-motion: when
 * reduced, content renders immediately at full opacity with no transform.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  from = "up",
  distance = 24,
  once = true,
  as: Tag = "div",
  style,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once, reduced]);

  const initialTransform = (() => {
    if (reduced || from === "none") return "none";
    switch (from) {
      case "down":
        return `translate3d(0, -${distance}px, 0)`;
      case "left":
        return `translate3d(-${distance}px, 0, 0)`;
      case "right":
        return `translate3d(${distance}px, 0, 0)`;
      case "up":
      default:
        return `translate3d(0, ${distance}px, 0)`;
    }
  })();

  const baseStyle: CSSProperties = reduced
    ? {}
    : {
        opacity: visible ? 1 : 0,
        transform: visible ? "translate3d(0,0,0)" : initialTransform,
        transition:
          "opacity 900ms cubic-bezier(0.16, 1, 0.3, 1), transform 900ms cubic-bezier(0.16, 1, 0.3, 1), filter 900ms cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delay}ms`,
        filter: visible ? "blur(0)" : "blur(6px)",
        willChange: visible ? "auto" : "opacity, transform, filter",
      };

  return (
    <Tag
      ref={ref as never}
      className={className}
      style={{ ...baseStyle, ...style }}
    >
      {children}
    </Tag>
  );
}

/**
 * Subtle scroll-driven parallax — translates the target on the Y axis based on
 * its position in the viewport. Skipped under prefers-reduced-motion and on
 * narrow viewports (where it provides little value but costs scroll fps).
 */
export function useParallax(strength = 0.15, disableBelow = 768) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    if (window.innerWidth < disableBelow) return;

    let raf = 0;
    let ticking = false;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const offset = (center - window.innerHeight / 2) * strength;
      el.style.transform = `translate3d(0, ${(-offset).toFixed(1)}px, 0)`;
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [strength, disableBelow, reduced]);

  return ref;
}

/**
 * Reads scroll progress (0–1) for the document. Throttled via rAF.
 */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let ticking = false;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max <= 0 ? 0 : Math.max(0, Math.min(1, window.scrollY / max));
      setProgress(p);
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return progress;
}

/**
 * Animates a numeric counter into view. Pass the target number; returns the
 * current value to render. Honors reduced motion.
 */
export function useCountUp(target: number | null | undefined, durationMs = 1400) {
  const [value, setValue] = useState<number>(target ?? 0);
  const ref = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const fired = useRef(false);

  useEffect(() => {
    if (target == null) return;
    if (reduced || !ref.current) {
      setValue(target);
      return;
    }
    const el = ref.current;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !fired.current) {
          fired.current = true;
          const start = performance.now();
          const from = 0;
          const to = target;
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / durationMs);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - t, 3);
            setValue(from + (to - from) * eased);
            if (t < 1) requestAnimationFrame(tick);
            else setValue(to);
          };
          requestAnimationFrame(tick);
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.4 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, durationMs, reduced]);

  return { ref, value } as const;
}
