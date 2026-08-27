import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export function defaultDetectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

export interface LandingSceneProps {
  readonly detectWebGL?: () => boolean;
}

/** Ink-wash mountain/cloud drift scene (three.js) for the Landing page; falls back to a static image without WebGL. */
export function LandingScene({ detectWebGL = defaultDetectWebGL }: LandingSceneProps) {
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
      camera.position.z = 6;
      renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true });

      // Low-poly, flat-shaded mountain silhouette drifting slowly, per design.md's ink-wash 3D style.
      const mountain = new THREE.Mesh(
        new THREE.ConeGeometry(2, 3, 5),
        new THREE.MeshBasicMaterial({ color: 0x1a1a1a, wireframe: true }),
      );
      scene.add(mountain);

      const animate = () => {
        mountain.rotation.y += 0.0015;
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
        src="/theme/landing-fallback.png"
        alt="Ink-wash mountains and drifting clouds"
        data-testid="landing-scene-fallback"
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      data-testid="landing-scene-canvas"
      aria-label="Animated ink-wash mountain and cloud scene"
    />
  );
}
