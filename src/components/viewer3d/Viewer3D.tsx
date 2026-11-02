import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { FrontSide } from "three";
import type { FurnitureItem, Room } from "../../types/model";
import { useProjectStore } from "../../store/useProjectStore";
import { buildFloorGeometry, buildWallGeometry } from "./geometry";
import { buildFurnitureObject, disposeFurnitureObject } from "./furniture";
import { cameraForRoom } from "./camera";

const fallbackText =
  "현재 브라우저에서는 3D 보기를 사용할 수 없습니다. 2D 편집은 계속 사용할 수 있습니다.";
function webglAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
class ViewerBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
function RoomMeshes({ room }: { room: Room }) {
  const floor = useMemo(() => buildFloorGeometry(room.polygon), [room.polygon]);
  const walls = useMemo(() => buildWallGeometry(room), [room]);
  useEffect(
    () => () => {
      floor.dispose();
    },
    [floor],
  );
  useEffect(
    () => () => {
      walls.dispose();
    },
    [walls],
  );
  return (
    <>
      <mesh geometry={floor}>
        <meshStandardMaterial color="#e2e9e7" side={FrontSide} />
      </mesh>
      <mesh geometry={walls}>
        <meshStandardMaterial
          color="#aebfc1"
          side={FrontSide}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
function FurnitureMesh({ item }: { item: FurnitureItem }) {
  const object = useMemo(() => buildFurnitureObject(item), [item]);
  useEffect(() => () => disposeFurnitureObject(object), [object]);
  return <primitive object={object} dispose={null} />;
}
function Scene({
  room,
  items,
  reset,
}: {
  room: Room;
  items: FurnitureItem[];
  reset: number;
}) {
  const { camera, size } = useThree();
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const frame = useMemo(
    () =>
      cameraForRoom(room, Math.max(size.width, 1) / Math.max(size.height, 1)),
    [room, size.width, size.height],
  );
  useEffect(() => {
    camera.position.copy(frame.position);
    camera.lookAt(frame.target);
    camera.updateProjectionMatrix();
    if (controls.current) {
      controls.current.target.copy(frame.target);
      controls.current.update();
    }
  }, [camera, frame, reset]);
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        intensity={0.8}
        position={[frame.target.x + 5, frame.target.y + 10, frame.target.z + 5]}
      />
      <RoomMeshes room={room} />
      {items.map((item) => (
        <FurnitureMesh key={item.id} item={item} />
      ))}
      <OrbitControls
        ref={controls}
        target={frame.target}
        minDistance={0.5}
        maxDistance={frame.maxDistance}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </>
  );
}
export default function Viewer3D() {
  const room = useProjectStore((s) => s.project.room),
    items = useProjectStore((s) => s.project.furniture);
  const [available, setAvailable] = useState(webglAvailable),
    [lost, setLost] = useState(false),
    [generation, setGeneration] = useState(0),
    [reset, setReset] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handleContextLost = useCallback((event: Event) => {
    event.preventDefault();
    setLost(true);
  }, []);
  const attachCanvas = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      canvasRef.current?.removeEventListener(
        "webglcontextlost",
        handleContextLost,
      );
      canvasRef.current = canvas;
      canvas?.addEventListener("webglcontextlost", handleContextLost);
    },
    [handleContextLost],
  );
  const retry = () => {
    setLost(false);
    setAvailable(webglAvailable());
    setGeneration((value) => value + 1);
  };
  const fail = () => setAvailable(false);
  return (
    <section
      aria-label="3D 보기"
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", gap: 8, padding: 8 }}>
        <button type="button" onClick={() => setReset((value) => value + 1)}>
          전체 보기
        </button>
        <button type="button" onClick={() => setReset((value) => value + 1)}>
          카메라 초기화
        </button>
      </div>
      {!available || lost ? (
        <div role="status">
          <p>
            {lost ? "3D 연결이 끊겼습니다. 다시 시도해 주세요." : fallbackText}
          </p>
          <button type="button" onClick={retry}>
            다시 시도
          </button>
        </div>
      ) : (
        <ViewerBoundary key={generation} onError={fail}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Canvas
              ref={attachCanvas}
              aria-label="3D 방 보기"
              dpr={[1, 2]}
              camera={{ fov: 45, near: 0.1, far: 200 }}
            >
              <Scene room={room} items={items} reset={reset} />
            </Canvas>
          </div>
        </ViewerBoundary>
      )}
    </section>
  );
}
