import * as THREE from "three";

interface OfficeDecorProps {
  floorWidth: number;
  floorDepth: number;
}

function PottedPlant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Pot */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.15, 0.4, 12]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.41, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.02, 12]} />
        <meshStandardMaterial color="#3e2723" />
      </mesh>
      {/* Foliage */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshStandardMaterial color="#2e7d32" />
      </mesh>
      <mesh position={[0.15, 0.85, 0.1]} castShadow>
        <sphereGeometry args={[0.2, 10, 10]} />
        <meshStandardMaterial color="#388e3c" />
      </mesh>
      <mesh position={[-0.12, 0.82, -0.08]} castShadow>
        <sphereGeometry args={[0.18, 10, 10]} />
        <meshStandardMaterial color="#43a047" />
      </mesh>
    </group>
  );
}

function WaterCooler({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.35]} />
        <meshStandardMaterial color="#9e9e9e" />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.35, 0.4, 0.3]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
      {/* Water jug */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, 0.5, 12]} />
        <meshStandardMaterial color="#42a5f5" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

function Bookshelf({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const bookColors = ["#c62828", "#1565c0", "#2e7d32", "#f9a825", "#6a1b9a", "#e65100"];
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Frame sides */}
      <mesh position={[-0.45, 0.6, 0]} castShadow>
        <boxGeometry args={[0.06, 1.2, 0.35]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      <mesh position={[0.45, 0.6, 0]} castShadow>
        <boxGeometry args={[0.06, 1.2, 0.35]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      {/* Shelves */}
      {[0.0, 0.4, 0.8, 1.2].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow>
          <boxGeometry args={[0.96, 0.04, 0.35]} />
          <meshStandardMaterial color="#6d4c41" />
        </mesh>
      ))}
      {/* Books on each shelf */}
      {[0.12, 0.52, 0.92].map((shelfY, si) => (
        <group key={si}>
          {bookColors.slice(0, 4 + (si % 2)).map((bc, bi) => (
            <mesh key={bi} position={[-0.3 + bi * 0.15, shelfY + 0.14, 0]} castShadow>
              <boxGeometry args={[0.1, 0.24 + (bi % 3) * 0.04, 0.25]} />
              <meshStandardMaterial color={bc} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Rug({ position, width, depth }: { position: [number, number, number]; width: number; depth: number }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color="#8d6e63" side={THREE.DoubleSide} />
    </mesh>
  );
}

export function OfficeDecor({ floorWidth, floorDepth }: OfficeDecorProps) {
  const hw = floorWidth / 2 - 0.5;
  const hd = floorDepth / 2 - 0.5;

  return (
    <group>
      {/* Plants in corners */}
      <PottedPlant position={[-hw, 0, -hd]} />
      <PottedPlant position={[hw, 0, -hd]} />
      <PottedPlant position={[-hw, 0, hd]} />

      {/* Water cooler along one edge */}
      <WaterCooler position={[hw, 0, hd * 0.3]} />

      {/* Bookshelves along back wall */}
      <Bookshelf position={[-hw * 0.4, 0, -hd]} />
      <Bookshelf position={[hw * 0.4, 0, -hd]} />

      {/* Rug under the desk area */}
      <Rug
        position={[0, 0.005, 0]}
        width={Math.min(floorWidth * 0.6, 8)}
        depth={Math.min(floorDepth * 0.5, 6)}
      />
    </group>
  );
}
