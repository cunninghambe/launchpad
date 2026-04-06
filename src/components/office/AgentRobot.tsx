import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import * as THREE from "three";
import type { OfficeAgent } from "../../api/office";
import { getRandomFloorPoint } from "./layout-utils";

const STATUS_COLORS: Record<OfficeAgent["status"], string> = {
  active: "#22c55e",
  paused: "#f59e0b",
  idle: "#6b7280",
  error: "#ef4444",
};

// Deterministic hash from agent id → stable random traits per robot
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRandom(seed: number, index: number): number {
  const x = Math.sin(seed * 9301 + index * 49297) * 49297;
  return x - Math.floor(x);
}

// Accent colors that tint the trim/details (not the main status color)
const ACCENT_PALETTE = [
  "#60a5fa", // blue
  "#c084fc", // purple
  "#f472b6", // pink
  "#fb923c", // orange
  "#34d399", // teal
  "#fbbf24", // gold
  "#a78bfa", // lavender
  "#38bdf8", // sky
];

interface RobotTraits {
  scale: number;           // 0.85 – 1.15 overall size
  headShape: "box" | "round" | "tall";
  hasAntenna: boolean;
  antennaHeight: number;
  hasVisor: boolean;       // single visor strip vs two round eyes
  accentColor: string;     // trim / antenna / chest-plate accent
  bodyWidthMul: number;    // 0.9 – 1.2 stocky vs thin
  legLength: number;       // 0.8 – 1.1
  armStyle: "thin" | "bulky";
  hasChestPlate: boolean;
  hasBackpack: boolean;
  hasBeltDetail: boolean;
  walkSpeed: number;       // 1.2 – 1.8
  breatheSpeed: number;    // 1.2 – 2.0
  eyeSpacing: number;      // 0.05 – 0.09
}

function generateTraits(id: string): RobotTraits {
  const h = hashId(id);
  const r = (i: number) => seededRandom(h, i);

  return {
    scale: 0.85 + r(0) * 0.3,
    headShape: (["box", "round", "tall"] as const)[Math.floor(r(1) * 3)],
    hasAntenna: r(2) > 0.5,
    antennaHeight: 0.12 + r(3) * 0.18,
    hasVisor: r(4) > 0.55,
    accentColor: ACCENT_PALETTE[Math.floor(r(5) * ACCENT_PALETTE.length)],
    bodyWidthMul: 0.9 + r(6) * 0.3,
    legLength: 0.8 + r(7) * 0.3,
    armStyle: r(8) > 0.5 ? "bulky" : "thin",
    hasChestPlate: r(9) > 0.4,
    hasBackpack: r(10) > 0.65,
    hasBeltDetail: r(11) > 0.5,
    walkSpeed: 1.2 + r(12) * 0.6,
    breatheSpeed: 1.2 + r(13) * 0.8,
    eyeSpacing: 0.05 + r(14) * 0.04,
  };
}

interface AgentRobotProps {
  agent: OfficeAgent;
  deskPosition: [number, number, number];
  floorBounds: { width: number; depth: number };
}

export function AgentRobot({ agent, deskPosition, floorBounds }: AgentRobotProps) {
  const groupRef = useRef<Group>(null);
  const color = STATUS_COLORS[agent.status];
  const isSeated = agent.status === "active" || agent.status === "paused" || agent.status === "error";

  const traits = useMemo(() => generateTraits(agent.id), [agent.id]);

  // Wandering state for idle robots
  const wanderState = useMemo(
    () => ({
      target: new THREE.Vector3(deskPosition[0], 0, deskPosition[2]),
      current: new THREE.Vector3(deskPosition[0], 0, deskPosition[2]),
      angle: 0,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [agent.id],
  );

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (isSeated) {
      groupRef.current.position.set(deskPosition[0], 0, deskPosition[2] + 0.8);
      groupRef.current.rotation.y = Math.PI;
      const breathe = Math.sin(state.clock.elapsedTime * traits.breatheSpeed) * 0.02;
      groupRef.current.position.y = breathe;
    } else {
      const dx = wanderState.target.x - wanderState.current.x;
      const dz = wanderState.target.z - wanderState.current.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.3) {
        const [nx, nz] = getRandomFloorPoint(floorBounds.width, floorBounds.depth, 1.5);
        wanderState.target.set(nx, 0, nz);
      } else {
        const speed = traits.walkSpeed * delta;
        const moveX = (dx / dist) * Math.min(speed, dist);
        const moveZ = (dz / dist) * Math.min(speed, dist);
        wanderState.current.x += moveX;
        wanderState.current.z += moveZ;
        wanderState.angle = Math.atan2(moveX, moveZ);
      }

      const bob = Math.abs(Math.sin(state.clock.elapsedTime * 6)) * 0.06;
      groupRef.current.position.set(wanderState.current.x, bob, wanderState.current.z);
      groupRef.current.rotation.y = wanderState.angle;
    }
  });

  const emissiveIntensity = agent.status === "error" ? 0.8 : 0.2;
  const bw = 0.36 * traits.bodyWidthMul;
  const legH = 0.36 * traits.legLength;
  const legY = legH / 2;
  const bodyY = legH + 0.16;
  const armW = traits.armStyle === "bulky" ? 0.12 : 0.08;
  const armH = traits.armStyle === "bulky" ? 0.3 : 0.28;

  // Head dimensions vary by shape
  const headW = traits.headShape === "tall" ? 0.24 : 0.28;
  const headH = traits.headShape === "tall" ? 0.3 : traits.headShape === "round" ? 0.26 : 0.24;
  const headD = traits.headShape === "round" ? 0.26 : 0.24;
  const headY = bodyY + 0.16 + headH / 2 + 0.02;

  // Eye vertical position (relative to head center)
  const eyeY = headY + 0.02;
  const eyeZ = -(headD / 2 + 0.005);

  return (
    <group ref={groupRef} scale={[traits.scale, traits.scale, traits.scale]}>
      {/* Legs */}
      <mesh position={[-0.12, legY, 0]} castShadow>
        <boxGeometry args={[0.1, legH, 0.12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[0.12, legY, 0]} castShadow>
        <boxGeometry args={[0.1, legH, 0.12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.1} />
      </mesh>

      {/* Feet */}
      <mesh position={[-0.12, 0.03, -0.03]} castShadow>
        <boxGeometry args={[0.12, 0.06, 0.18]} />
        <meshStandardMaterial color={traits.accentColor} />
      </mesh>
      <mesh position={[0.12, 0.03, -0.03]} castShadow>
        <boxGeometry args={[0.12, 0.06, 0.18]} />
        <meshStandardMaterial color={traits.accentColor} />
      </mesh>

      {/* Belt detail */}
      {traits.hasBeltDetail && (
        <mesh position={[0, legH + 0.02, 0]}>
          <boxGeometry args={[bw + 0.04, 0.04, 0.26]} />
          <meshStandardMaterial color={traits.accentColor} metalness={0.6} roughness={0.3} />
        </mesh>
      )}

      {/* Body / torso */}
      <mesh position={[0, bodyY, 0]} castShadow>
        <boxGeometry args={[bw, 0.32, 0.24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} />
      </mesh>

      {/* Chest plate accent */}
      {traits.hasChestPlate && (
        <mesh position={[0, bodyY + 0.02, -0.125]}>
          <boxGeometry args={[bw * 0.6, 0.18, 0.02]} />
          <meshStandardMaterial
            color={traits.accentColor}
            metalness={0.7}
            roughness={0.2}
            emissive={traits.accentColor}
            emissiveIntensity={0.15}
          />
        </mesh>
      )}

      {/* Shoulder joints */}
      <mesh position={[-(bw / 2 + 0.04), bodyY + 0.1, 0]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial color={traits.accentColor} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[(bw / 2 + 0.04), bodyY + 0.1, 0]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial color={traits.accentColor} metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Arms */}
      <mesh position={[-(bw / 2 + armW / 2 + 0.04), bodyY - 0.04, 0]} castShadow>
        <boxGeometry args={[armW, armH, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[(bw / 2 + armW / 2 + 0.04), bodyY - 0.04, 0]} castShadow>
        <boxGeometry args={[armW, armH, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.1} />
      </mesh>

      {/* Backpack */}
      {traits.hasBackpack && (
        <mesh position={[0, bodyY, 0.15]} castShadow>
          <boxGeometry args={[bw * 0.7, 0.24, 0.1]} />
          <meshStandardMaterial color={traits.accentColor} metalness={0.4} roughness={0.4} />
        </mesh>
      )}

      {/* Neck */}
      <mesh position={[0, bodyY + 0.2, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.06, 8]} />
        <meshStandardMaterial color={traits.accentColor} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Head */}
      <mesh position={[0, headY, 0]} castShadow>
        {traits.headShape === "round" ? (
          <sphereGeometry args={[headW / 2, 12, 12]} />
        ) : (
          <boxGeometry args={[headW, headH, headD]} />
        )}
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} />
      </mesh>

      {/* Eyes / Visor */}
      {traits.hasVisor ? (
        // Single visor strip
        <mesh position={[0, eyeY, eyeZ]}>
          <boxGeometry args={[headW * 0.75, 0.05, 0.02]} />
          <meshStandardMaterial
            color="#b0e0ff"
            emissive="#80d0ff"
            emissiveIntensity={1.2}
            metalness={0.8}
            roughness={0.1}
          />
        </mesh>
      ) : (
        // Two round eyes
        <>
          <mesh position={[-traits.eyeSpacing, eyeY, eyeZ]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
          </mesh>
          <mesh position={[traits.eyeSpacing, eyeY, eyeZ]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
          </mesh>
        </>
      )}

      {/* Antenna */}
      {traits.hasAntenna && (
        <>
          <mesh position={[0, headY + headH / 2 + traits.antennaHeight / 2, 0]}>
            <cylinderGeometry args={[0.015, 0.015, traits.antennaHeight, 6]} />
            <meshStandardMaterial color={traits.accentColor} metalness={0.7} roughness={0.2} />
          </mesh>
          <mesh position={[0, headY + headH / 2 + traits.antennaHeight + 0.025, 0]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial
              color={traits.accentColor}
              emissive={traits.accentColor}
              emissiveIntensity={0.8}
            />
          </mesh>
        </>
      )}

      {/* Ear details (small cubes on sides of head) */}
      <mesh position={[-(headW / 2 + 0.02), headY, 0]}>
        <boxGeometry args={[0.04, 0.08, 0.06]} />
        <meshStandardMaterial color={traits.accentColor} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[(headW / 2 + 0.02), headY, 0]}>
        <boxGeometry args={[0.04, 0.08, 0.06]} />
        <meshStandardMaterial color={traits.accentColor} metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
}
