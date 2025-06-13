import { useEffect, useRef } from "react";

export default function ThreeLogo() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const animationIdRef = useRef<number>();

  useEffect(() => {
    if (!mountRef.current || typeof window === "undefined") return;

    // Check if Three.js is available
    const THREE = (window as any).THREE;
    if (!THREE) {
      console.warn("Three.js not loaded");
      return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(200, 200);
    renderer.setClearColor(0x000000, 0);
    
    sceneRef.current = scene;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Create shield geometry
    const shieldGeometry = new THREE.ConeGeometry(1.2, 2, 6);
    
    // Create materials with neon glow
    const shieldMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.8,
    });
    
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });

    // Create meshes
    const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
    const wireframeShield = new THREE.Mesh(shieldGeometry, wireframeMaterial);
    
    // Scale wireframe slightly larger
    wireframeShield.scale.setScalar(1.05);

    // Add to scene
    scene.add(shield);
    scene.add(wireframeShield);

    // Add point lights for glow effect
    const light1 = new THREE.PointLight(0x00ff88, 1, 10);
    light1.position.set(2, 2, 2);
    scene.add(light1);

    const light2 = new THREE.PointLight(0x00d4ff, 1, 10);
    light2.position.set(-2, -2, 2);
    scene.add(light2);

    // Position camera
    camera.position.z = 4;

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      // Rotate the shield
      shield.rotation.y += 0.01;
      wireframeShield.rotation.y += 0.008;
      
      // Add subtle floating motion
      shield.position.y = Math.sin(Date.now() * 0.001) * 0.1;
      wireframeShield.position.y = Math.cos(Date.now() * 0.001) * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup function
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      if (renderer) {
        renderer.dispose();
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-48 h-48 mx-auto flex items-center justify-center animate-float"
      style={{ filter: "drop-shadow(0 0 20px rgba(0, 255, 136, 0.6))" }}
    />
  );
}
