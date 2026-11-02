import { useCallback, useEffect, useRef, useState } from "react";
import { getBBox, zoomAtPointer, type Viewport } from "../../lib/geometry";
import { useUIStore } from "../../store/useUIStore";
import type { PointMm } from "../../types/model";
export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
const uiKey = `roomfit3d:v2:${import.meta.env.BASE_URL}:ui`;
export function useViewport(polygon: PointMm[], projectId: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [view, setView] = useState<Viewport>({ zoom: 0.1, panX: 50, panY: 50 });
  const [mode, setMode] = useState<"zoom" | "pan">(() => {
    try {
      return localStorage.getItem(uiKey) === "pan" ? "pan" : "zoom";
    } catch {
      return "zoom";
    }
  });
  const fit = useCallback(() => {
    const box = getBBox(polygon);
    const zoom = clamp(
      Math.min((size.width - 100) / box.width, (size.height - 100) / box.depth),
      0.02,
      1.5,
    );
    setView({
      zoom,
      panX: (size.width - box.width * zoom) / 2 - box.minX * zoom,
      panY: (size.height - box.depth * zoom) / 2 - box.minY * zoom,
    });
  }, [polygon, size]);
  const fitted = useRef<string | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (fitted.current !== projectId && size.width > 100 && size.height > 100) {
      fit();
      fitted.current = projectId;
    }
  }, [fit, size, projectId]);
  useEffect(() => {
    try {
      localStorage.setItem(uiKey, mode);
    } catch {
      /* UI preference is optional. */
    }
  }, [mode]);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? size.height : 1;
      const dx = clamp(e.deltaX * unit, -300, 300),
        dy = clamp(e.deltaY * unit, -300, 300);
      const r = node.getBoundingClientRect();
      if (
        (mode === "zoom" && !e.shiftKey) ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      ) {
        setView((v) =>
          zoomAtPointer(
            v,
            { x: e.clientX - r.left, y: e.clientY - r.top },
            clamp(v.zoom * Math.exp(-dy * 0.002), 0.02, 1.5),
          ),
        );
      } else
        setView((v) => ({
          ...v,
          panX: v.panX - (e.shiftKey ? dy : dx),
          panY: v.panY - (e.shiftKey ? 0 : dy),
        }));
    };
    node.addEventListener("wheel", wheel, { passive: false });
    return () => node.removeEventListener("wheel", wheel);
  }, [mode, size.height]);
  useEffect(() => {
    const node = ref.current;
    if (!node || !("ongesturechange" in window)) return;
    let previousScale = 1;
    const start = (event: Event) => {
      event.preventDefault();
      previousScale = 1;
    };
    const change = (event: Event) => {
      event.preventDefault();
      const gesture = event as Event & {
        scale: number;
        clientX: number;
        clientY: number;
      };
      if (!Number.isFinite(gesture.scale) || gesture.scale <= 0) return;
      const rect = node.getBoundingClientRect();
      const point = {
        x: Number.isFinite(gesture.clientX)
          ? gesture.clientX - rect.left
          : rect.width / 2,
        y: Number.isFinite(gesture.clientY)
          ? gesture.clientY - rect.top
          : rect.height / 2,
      };
      const ratio = clamp(gesture.scale / previousScale, 0.5, 2);
      previousScale = gesture.scale;
      setView((v) => zoomAtPointer(v, point, clamp(v.zoom * ratio, 0.02, 1.5)));
    };
    node.addEventListener("gesturestart", start, { passive: false });
    node.addEventListener("gesturechange", change, { passive: false });
    return () => {
      node.removeEventListener("gesturestart", start);
      node.removeEventListener("gesturechange", change);
    };
  }, []);
  useEffect(() => {
    if (size.width > 0 && size.height > 0)
      useUIStore
        .getState()
        .setViewportCenter({
          x: (size.width / 2 - view.panX) / view.zoom,
          y: (size.height / 2 - view.panY) / view.zoom,
        });
  }, [size, view]);
  return { ref, size, view, setView, mode, setMode, fit };
}
