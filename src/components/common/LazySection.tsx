import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Defers mounting (and therefore data fetching) of below-the-fold sections
 * until they are close to the viewport. Purely a performance wrapper —
 * markup and styling of children are unchanged.
 */
export function LazySection({
  children,
  minHeight = 240,
}: {
  children: ReactNode;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return <div ref={ref}>{visible ? children : <div style={{ minHeight }} aria-hidden />}</div>;
}
