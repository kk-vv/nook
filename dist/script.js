const year = document.querySelector("[data-year]");

if (year) {
  year.textContent = String(new Date().getFullYear());
}

const field = document.querySelector("[data-signal-field]");

if (field instanceof HTMLCanvasElement) {
  const context = field.getContext("2d", { alpha: true });
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointCount = 52;
  const points = Array.from({ length: pointCount }, (_, index) => {
    const random = (salt) => {
      const value = Math.sin((index + 1) * 127.1 + salt * 311.7) * 43758.5453;
      return value - Math.floor(value);
    };

    return {
      x: random(1),
      y: random(2),
      radius: 0.45 + random(3) * 0.9,
      alpha: 0.035 + random(4) * 0.1,
      phase: random(5) * Math.PI * 2,
    };
  });

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    field.width = Math.round(width * pixelRatio);
    field.height = Math.round(height * pixelRatio);
    field.style.width = `${width}px`;
    field.style.height = `${height}px`;
  };

  const drawGlow = (x, y, radius, color) => {
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = gradient;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  };

  const draw = (time = 0) => {
    if (!context) return;

    pointerX += (targetX - pointerX) * 0.035;
    pointerY += (targetY - pointerY) * 0.035;

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = "screen";

    const fieldRadius = Math.max(width, height) * 0.64;
    drawGlow(
      width * 0.12 + pointerX * 18,
      height * 0.08 + pointerY * 12,
      fieldRadius,
      "rgba(155, 51, 20, 0.13)",
    );
    drawGlow(
      width * 0.9 - pointerX * 12,
      height * 0.72 - pointerY * 10,
      fieldRadius * 0.86,
      "rgba(28, 64, 108, 0.105)",
    );

    const orbitRadius = Math.min(width * 0.34, 500);
    context.lineWidth = 0.75;
    context.strokeStyle = "rgba(225, 228, 224, 0.055)";
    context.beginPath();
    context.ellipse(
      width * 0.5 + pointerX * 8,
      height * 0.34 + pointerY * 6,
      orbitRadius,
      orbitRadius * 0.7,
      -0.32,
      Math.PI * 1.06,
      Math.PI * 1.86,
    );
    context.stroke();

    context.globalCompositeOperation = "source-over";
    points.forEach((point) => {
      const driftX = Math.sin(time * 0.00008 + point.phase) * 9;
      const driftY = Math.cos(time * 0.000065 + point.phase) * 7;
      const x = point.x * width + driftX + pointerX * 5;
      const y = point.y * height + driftY + pointerY * 4;

      context.beginPath();
      context.fillStyle = `rgba(220, 224, 220, ${point.alpha})`;
      context.arc(x, y, point.radius, 0, Math.PI * 2);
      context.fill();
    });

    if (!reducedMotion) window.requestAnimationFrame(draw);
  };

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener(
    "pointermove",
    (event) => {
      targetX = event.clientX / Math.max(width, 1) - 0.5;
      targetY = event.clientY / Math.max(height, 1) - 0.5;
    },
    { passive: true },
  );

  resize();
  draw();
}
