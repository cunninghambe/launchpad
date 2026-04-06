import { useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { OfficeAgent } from "../../api/office";
import { AgentRobot } from "./AgentRobot";

interface AgentDeskProps {
  agent: OfficeAgent;
  position: [number, number, number];
  floorBounds: { width: number; depth: number };
  onSelect?: (agent: OfficeAgent) => void;
}

export function AgentDesk({ agent, position, floorBounds, onSelect }: AgentDeskProps) {
  const [hovered, setHovered] = useState(false);

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    onSelect?.(agent);
  }

  return (
    <group position={position}>
      {/* Desk surface */}
      <mesh
        position={[0, 0.4, 0]}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1.8, 0.08, 1.2]} />
        <meshStandardMaterial color={hovered ? "#c8a97a" : "#a07850"} />
      </mesh>

      {/* Desk legs */}
      {(
        [
          [-0.7, -0.5],
          [0.7, -0.5],
          [-0.7, 0.5],
          [0.7, 0.5],
        ] as [number, number][]
      ).map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.2, lz]} castShadow>
          <boxGeometry args={[0.08, 0.4, 0.08]} />
          <meshStandardMaterial color="#7a5c30" />
        </mesh>
      ))}

      {/* Monitor screen */}
      <mesh position={[0, 0.75, -0.3]} castShadow>
        <boxGeometry args={[0.9, 0.55, 0.04]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>

      {/* Monitor stand */}
      <mesh position={[0, 0.5, -0.3]}>
        <boxGeometry args={[0.08, 0.15, 0.08]} />
        <meshStandardMaterial color="#2a2a3e" />
      </mesh>

      {/* Chair seat */}
      <mesh position={[0, 0.25, 0.8]} castShadow>
        <boxGeometry args={[0.8, 0.08, 0.8]} />
        <meshStandardMaterial color="#374151" />
      </mesh>

      {/* Chair back */}
      <mesh position={[0, 0.6, 1.1]}>
        <boxGeometry args={[0.8, 0.7, 0.08]} />
        <meshStandardMaterial color="#374151" />
      </mesh>

      {/* Robot agent (replaces the old status orb) */}
      <AgentRobot agent={agent} deskPosition={position} floorBounds={floorBounds} />

      {/* Name label */}
      <Html position={[0, 1.4, 0]} center>
        <div
          style={{
            background: "rgba(0,0,0,0.7)",
            color: "#fff",
            padding: "2px 6px",
            borderRadius: 4,
            fontSize: 11,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {agent.name}
        </div>
      </Html>
    </group>
  );
}
