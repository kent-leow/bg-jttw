import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { defaultDetectWebGL } from "./landingScene";

export interface AssassinationSuspenseSceneProps {
  readonly detectWebGL?: () => boolean;
}

/** Swirling ink-cloud suspense scene (three.js) shown to non-Assassin devices; falls back to a static image without WebGL. */
export function AssassinationSuspenseScene({ detectWebGL = defaultDetectWebGL }: AssassinationSuspenseSceneProps) {
  const [webglAvailable] = useState(() => detectWebGL());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!webglAvailable || !canvasRef.current) {
      return;
    }
    let frameId = 0;
    let renderer: THREE.WebGLRenderer | undefined;
    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
      camera.position.z = 5;
      renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true });

      const cloud = new THREE.Mesh(
        new THREE.TorusKnotGeometry(1, 0.3, 32, 8),
        new THREE.MeshBasicMaterial({ color: 0x3b3b6d, wireframe: true }),
      );
      scene.add(cloud);

      const animate = () => {
        cloud.rotation.x += 0.004;
        cloud.rotation.y += 0.006;
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
  }, [webglAvailable]);

  if (!webglAvailable) {
    return (
      <img
        src="/theme/assassination-suspense-fallback.png"
        alt="Swirling ink clouds"
        data-testid="assassination-suspense-scene-fallback"
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      data-testid="assassination-suspense-scene-canvas"
      aria-label="Animated swirling ink-cloud scene"
    />
  );
}
