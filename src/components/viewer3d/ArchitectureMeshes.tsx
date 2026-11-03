import type { Room } from "../../types/model";
import {
  getOpeningSegment,
  validateArchitecture,
} from "../../features/architecture/geometry";

export function ArchitectureMeshes({ room }: { room: Room }) {
  const invalid = new Set(validateArchitecture(room).map((i) => i.itemId));
  return (
    <>
      {(room.zones ?? [])
        .filter((z) => !invalid.has(z.id))
        .map((z) => (
          <mesh
            key={z.id}
            position={[
              (z.x + z.widthMm / 2) / 1000,
              0.004,
              (z.y + z.depthMm / 2) / 1000,
            ]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[z.widthMm / 1000, z.depthMm / 1000]} />
            <meshBasicMaterial
              color="#72ad9d"
              transparent
              opacity={0.18}
              depthWrite={false}
            />
          </mesh>
        ))}
      {(room.openings ?? [])
        .filter((o) => !invalid.has(o.id))
        .map((o) => {
          const s = getOpeningSegment(room, o);
          if (!s) return null;
          const w = o.widthMm / 1000,
            h = o.heightMm / 1000,
            sill = o.sillMm / 1000;
          const yaw = -Math.atan2(s.tangent.y, s.tangent.x),
            depth = Math.min(s.thicknessMm / 1000, 0.12),
            bar = Math.min(0.04, w / 8, h / 8);
          const side = o.hinge === "start" ? 1 : -1;
          const hingeX = side === 1 ? 0 : w;
          const swing = o.swing === "inward" ? 1 : -1;
          return (
            <group
              key={o.id}
              position={[
                (s.start.x -
                  (s.partition ? 0 : (s.normal.x * s.thicknessMm) / 2)) /
                  1000,
                0,
                (s.start.y -
                  (s.partition ? 0 : (s.normal.y * s.thicknessMm) / 2)) /
                  1000,
              ]}
              rotation={[0, yaw, 0]}
            >
              <mesh position={[bar / 2, sill + h / 2, 0]}>
                <boxGeometry args={[bar, h, depth]} />
                <meshStandardMaterial color="#788e8d" />
              </mesh>
              <mesh position={[w - bar / 2, sill + h / 2, 0]}>
                <boxGeometry args={[bar, h, depth]} />
                <meshStandardMaterial color="#788e8d" />
              </mesh>
              <mesh position={[w / 2, sill + h - bar / 2, 0]}>
                <boxGeometry args={[w, bar, depth]} />
                <meshStandardMaterial color="#788e8d" />
              </mesh>
              {o.kind === "window" ? (
                <>
                  <mesh position={[w / 2, sill + bar / 2, 0]}>
                    <boxGeometry args={[w, bar, depth]} />
                    <meshStandardMaterial color="#788e8d" />
                  </mesh>
                  <mesh position={[w / 2, sill + h / 2, 0]}>
                    <boxGeometry
                      args={[
                        Math.max(0.01, w - 2 * bar),
                        Math.max(0.01, h - 2 * bar),
                        0.012,
                      ]}
                    />
                    <meshStandardMaterial
                      color="#a8d9df"
                      transparent
                      opacity={0.35}
                      depthWrite={false}
                    />
                  </mesh>
                </>
              ) : (
                <group
                  position={[hingeX, sill, 0]}
                  rotation={[0, (-side * swing * Math.PI) / 4, 0]}
                >
                  <mesh position={[(side * w) / 2, h / 2, 0]}>
                    <boxGeometry args={[w, h, 0.035]} />
                    <meshStandardMaterial color="#c6a984" />
                  </mesh>
                </group>
              )}
            </group>
          );
        })}
    </>
  );
}
