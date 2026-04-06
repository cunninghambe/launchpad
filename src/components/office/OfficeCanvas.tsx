import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import type { OfficeAgent } from "../../api/office";
import { AgentDesk } from "./AgentDesk";
import { OfficeDecor } from "./OfficeDecor";
import { calculateDeskLayout, getOfficeFloorDimensions } from "./layout-utils";

interface OfficeCanvasProps {
  agents: OfficeAgent[];
  onAgentSelect?: (agent: OfficeAgent) => void;
}

export function OfficeCanvas({ agents, onAgentSelect }: OfficeCanvasProps) {
  const positions = calculateDeskLayout(agents.length);
  const floor = getOfficeFloorDimensions(agents.length);
  const gridSize = Math.max(floor.width, floor.depth);
  const floorBounds = { width: floor.width + 4, depth: floor.depth + 4 };

  return (
    <div
      className="h-full w-full"
      style={{ touchAction: "none" }}
      role="img"
      aria-label="3D office visualization showing agent desks"
    >
      <Canvas
        shadows
        camera={{ fov: 50, position: [15, 15, 15] }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 15, 10]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <Suspense fallback={null}>
          {/* Floor plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[floorBounds.width, floorBounds.depth]} />
            <meshStandardMaterial color="#e5ddd0" />
          </mesh>

          {/* Grid helper */}
          <gridHelper
            args={[gridSize + 4, Math.ceil((gridSize + 4) / 2), "#cccccc", "#e0e0e0"]}
          />

          {/* Office decor */}
          <OfficeDecor floorWidth={floorBounds.width} floorDepth={floorBounds.depth} />

          {/* Agent desks */}
          {agents.map((agent, i) => {
            const pos = positions[i];
            if (!pos) return null;
            return (
              <AgentDesk
                key={agent.id}
                agent={agent}
                position={[pos.x, pos.y, pos.z]}
                floorBounds={floorBounds}
                onSelect={onAgentSelect}
              />
            );
          })}

          <Environment preset="city" />
        </Suspense>

        <OrbitControls
          makeDefault
          minDistance={5}
          maxDistance={60}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
    </div>
  );
}
