import { Circle, Line, Text } from "./konva";
export type MeasurementPoint = { x: number; y: number };
export function MeasurementLayer({
  points,
  zoom,
}: {
  points: MeasurementPoint[];
  zoom: number;
}) {
  if (!points.length) return null;
  return (
    <>
      {points.map((p, i) => (
        <Circle
          key={i}
          x={p.x}
          y={p.y}
          radius={4 / zoom}
          fill="#b04a1b"
          listening={false}
        />
      ))}
      {points.length === 2 && (
        <>
          <Line
            points={[points[0].x, points[0].y, points[1].x, points[1].y]}
            stroke="#b04a1b"
            strokeWidth={2 / zoom}
            dash={[5 / zoom, 4 / zoom]}
            listening={false}
          />
          <Text
            x={points[1].x + 8 / zoom}
            y={points[1].y + 8 / zoom}
            fontSize={12 / zoom}
            fill="#813717"
            text={`${Math.round(Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y) * 10) / 10} mm`}
            listening={false}
          />
        </>
      )}
    </>
  );
}
export function MeasurementControls({
  points,
  onChange,
}: {
  points: MeasurementPoint[];
  onChange: (points: MeasurementPoint[]) => void;
}) {
  const pair = points.length === 2 ? points : null;
  return (
    <div aria-label="두 점 실측 도구">
      <strong>두 점 실측</strong>{" "}
      {pair ? (
        <output aria-label="두 점 실측 결과">
          거리{" "}
          {Math.round(
            Math.hypot(pair[1].x - pair[0].x, pair[1].y - pair[0].y) * 10,
          ) / 10}{" "}
          mm · ΔX {pair[1].x - pair[0].x} mm · ΔY {pair[1].y - pair[0].y} mm
        </output>
      ) : (
        <span>캔버스에서 두 점을 선택하세요.</span>
      )}
      {pair &&
        pair.map((p, i) =>
          (["x", "y"] as const).map((axis) => (
            <label key={`${i}${axis}`}>
              {i === 0 ? "시작" : "끝"} {axis.toUpperCase()} (mm)
              <input
                type="number"
                step="0.5"
                value={p[axis]}
                onChange={(e) => {
                  const n = e.currentTarget.valueAsNumber;
                  if (Number.isFinite(n))
                    onChange(
                      pair.map((q, j) => (j === i ? { ...q, [axis]: n } : q)),
                    );
                }}
              />
            </label>
          )),
        )}
      <button onClick={() => onChange([])}>측정 지우기</button>
    </div>
  );
}
