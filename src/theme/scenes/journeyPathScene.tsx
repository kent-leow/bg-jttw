import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { defaultDetectWebGL } from "./landingScene";

const MAX_WAYPOINT = 5;

export interface JourneyPathSceneProps {
  /** Number of missions resolved so far (0-5); the traveling-party icon sits at this waypoint. */
  readonly resolvedMissionCount: number;
  readonly detectWebGL?: () => boolean;
}

/** Five-waypoint journey-path scene (three.js) on the Main Game Board; falls back to a static image without WebGL. */
export function JourneyPathScene({ resolvedMissionCount, detectWebGL = defaultDetectWebGL }: JourneyPathSceneProps) {
  const [webglAvailable] = useState(() => detectWebGL());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waypointIndex = Math.min(Math.max(resolvedMissionCount, 0), MAX_WAYPOINT);

  useEffect(() => {
    if (!webglAvailable || !canvasRef.current) {
      return;
    }
    let frameId = 0;
    let renderer: THREE.WebGLRenderer | undefined;
    try {
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-3, 3, 1, -1, 0.1, 10);
      camera.position.z = 5;
      renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true });

      // Five flat waypoint markers along the journey path, with the traveling-party icon at the current one.
      const waypoints = new THREE.Group();
      for (let i = 0; i < MAX_WAYPOINT; i += 1) {
        const marker = new THREE.Mesh(
          new THREE.CircleGeometry(0.15, 6),
          new THREE.MeshBasicMaterial({ color: i < waypointIndex ? 0xd4af37 : 0x3b3b6d }),
        );
        marker.position.x = -2.4 + i * 1.2;
        waypoints.add(marker);
      }
      const travelingParty = new THREE.Mesh(
        new THREE.ConeGeometry(0.1, 0.25, 4),
        new THREE.MeshBasicMaterial({ color: 0xc8102e }),
      );
      travelingParty.position.x = -2.4 + Math.min(waypointIndex, MAX_WAYPOINT - 1) * 1.2;
      waypoints.add(travelingParty);
      scene.add(waypoints);

      const animate = () => {
        renderer?.render(scene, camera);
        frameId = requestAnimationFrame(animate);
      };
      animate();
    } catch {
      // Real WebGL context creation failed at runtime despite detectWebGL() reporting available;
      // the <canvas> placeholder still renders without crashing the page.
    }
    return () => {
      cancelAnimationFrame(frameId);
      renderer?.dispose();
    };
  }, [webglAvailable, waypointIndex]);

  if (!webglAvailable) {
    return (
      <img
        src="/theme/journey-path-fallback.png"
        alt="Journey path across five mountain waypoints"
        data-testid="journey-path-fallback"
        data-waypoint={waypointIndex}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      data-testid="journey-path-canvas"
      data-waypoint={waypointIndex}
      aria-label="Animated journey path scene"
    />
  );
}
