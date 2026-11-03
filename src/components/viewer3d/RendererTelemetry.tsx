import { addAfterEffect, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

export type RendererSample = {
  frames: number;
  drawCalls: number;
  triangles: number;
  cpuMs: number;
  frameMs: number;
  renderer: string;
  gpuTimerAvailable: boolean;
};
export function RendererTelemetry({
  onSample,
}: {
  onSample: (sample: RendererSample) => void;
}) {
  const { gl } = useThree();
  const frame = useRef({ start: 0, previous: 0, count: 0, interval: 0 });
  useFrame(() => {
    const now = performance.now();
    frame.current.interval = frame.current.previous
      ? now - frame.current.previous
      : 0;
    frame.current.previous = now;
    frame.current.start = now;
  }, -1000);
  useEffect(() => {
    const context = gl.getContext();
    const debug = context.getExtension("WEBGL_debug_renderer_info");
    const renderer = debug
      ? String(context.getParameter(debug.UNMASKED_RENDERER_WEBGL))
      : String(context.getParameter(context.RENDERER));
    const gpuTimerAvailable = Boolean(
      context.getExtension("EXT_disjoint_timer_query_webgl2") ??
      context.getExtension("EXT_disjoint_timer_query"),
    );
    return addAfterEffect(() => {
      const f = frame.current;
      if (!f.start) return;
      f.count++;
      if (f.count % 10 === 0)
        onSample({
          frames: f.count,
          drawCalls: gl.info.render.calls,
          triangles: gl.info.render.triangles,
          cpuMs: performance.now() - f.start,
          frameMs: f.interval,
          renderer,
          gpuTimerAvailable,
        });
      f.start = 0;
    });
  }, [gl, onSample]);
  return null;
}
