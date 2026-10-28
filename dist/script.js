import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js";

const year = document.querySelector("[data-year]");

if (year) {
  year.textContent = String(new Date().getFullYear());
}

const field = document.querySelector("[data-signal-field]");

if (field instanceof HTMLCanvasElement) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({
    canvas: field,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.94;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x040607, 0.034);

  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 90);
  camera.position.set(0, 0, 18);

  const world = new THREE.Group();
  scene.add(world);

  scene.add(new THREE.HemisphereLight(0x7ceaf1, 0x11172a, 1.05));

  const keyLight = new THREE.DirectionalLight(0x83eff5, 2.3);
  keyLight.position.set(-8, 10, 14);
  scene.add(keyLight);

  const violetLight = new THREE.PointLight(0x866bd6, 2.1, 34, 2);
  violetLight.position.set(8, -2, 9);
  scene.add(violetLight);

  let seed = 0x454badd1;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const cubeCount = 190;
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const solidMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.17,
    shininess: 78,
    specular: 0xb8ffff,
    emissive: 0x0d91a2,
    emissiveIntensity: 0.62,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
  });
  const wireMaterial = new THREE.MeshBasicMaterial({
    color: 0x43dbea,
    transparent: true,
    opacity: 0.15,
    wireframe: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const cubes = new THREE.InstancedMesh(geometry, solidMaterial, cubeCount);
  const wires = new THREE.InstancedMesh(geometry, wireMaterial, cubeCount);
  cubes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  wires.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  cubes.frustumCulled = false;
  wires.frustumCulled = false;
  world.add(cubes, wires);

  const cyan = new THREE.Color(0x28d8e7);
  const blue = new THREE.Color(0x2986aa);
  const mint = new THREE.Color(0xb8f2d8);
  const violet = new THREE.Color(0x7f72bd);
  const palette = [cyan, cyan, cyan, blue, blue, mint, violet];
  const dummy = new THREE.Object3D();

  const cubeData = Array.from({ length: cubeCount }, (_, index) => {
    const sparseCenter = index % 7 === 0;
    const side = random() > 0.5 ? 1 : -1;
    const depth = -38 + random() * 51;
    const size = 0.14 + Math.pow(random(), 2.2) * 1.25;

    return {
      x: sparseCenter ? (random() - 0.5) * 7 : side * (3.8 + random() * 8.8),
      y: -9 + random() * 18,
      z: depth,
      size,
      speed: 0.42 + random() * 0.72,
      spinX: (random() - 0.5) * 0.16,
      spinY: (random() - 0.5) * 0.2,
      phase: random() * Math.PI * 2,
    };
  });

  cubeData.forEach((cube, index) => {
    cubes.setColorAt(index, palette[Math.floor(random() * palette.length)]);
  });
  cubes.instanceColor.needsUpdate = true;

  const particleCount = 820;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let index = 0; index < particleCount; index += 1) {
    const offset = index * 3;
    particlePositions[offset] = (random() - 0.5) * 30;
    particlePositions[offset + 1] = (random() - 0.5) * 19;
    particlePositions[offset + 2] = -40 + random() * 55;
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: 0x65dbe8,
    transparent: true,
    opacity: 0.28,
    size: 0.04,
    sizeAttenuation: true,
    depthWrite: false,
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  world.add(particles);

  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;
  let previousTime = performance.now();

  const resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  };

  const placeCube = (cube, index, time) => {
    const depthScale = THREE.MathUtils.mapLinear(cube.z, -38, 14, 0.62, 1.12);
    const pulse = 1 + Math.sin(time * 0.00045 + cube.phase) * 0.06;
    const size = cube.size * depthScale * pulse;

    dummy.position.set(cube.x, cube.y, cube.z);
    dummy.rotation.set(
      time * 0.00008 * cube.spinX,
      time * 0.0001 * cube.spinY,
      cube.phase * 0.08,
    );
    dummy.scale.setScalar(size);
    dummy.updateMatrix();
    cubes.setMatrixAt(index, dummy.matrix);

    dummy.scale.setScalar(size * 1.035);
    dummy.updateMatrix();
    wires.setMatrixAt(index, dummy.matrix);
  };

  const render = (time = performance.now()) => {
    const delta = Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;

    pointerX += (targetX - pointerX) * 0.035;
    pointerY += (targetY - pointerY) * 0.035;

    cubeData.forEach((cube, index) => {
      if (!reducedMotion) cube.z += delta * cube.speed;
      if (cube.z > 14) {
        cube.z = -38;
        cube.y = -9 + random() * 18;
      }
      placeCube(cube, index, time);
    });

    cubes.instanceMatrix.needsUpdate = true;
    wires.instanceMatrix.needsUpdate = true;

    camera.position.x = pointerX * 0.8;
    camera.position.y = -pointerY * 0.55;
    camera.lookAt(pointerX * -0.65, pointerY * 0.4, -5);
    world.rotation.y = pointerX * 0.018;
    world.rotation.x = pointerY * 0.012;
    if (!reducedMotion) particles.rotation.z = time * 0.000006;

    renderer.render(scene, camera);
    if (!reducedMotion) window.requestAnimationFrame(render);
  };

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener(
    "pointermove",
    (event) => {
      targetX = event.clientX / Math.max(window.innerWidth, 1) - 0.5;
      targetY = event.clientY / Math.max(window.innerHeight, 1) - 0.5;
    },
    { passive: true },
  );

  resize();
  render();
}
