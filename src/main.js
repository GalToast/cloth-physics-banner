import * as THREE from "three";

const canvas = document.querySelector("#cloth-canvas");

const CONFIG = {
  clothWidth: 54,
  clothHeight: 34,
  restDistance: 0.48,
  timestep: 18 / 1000,
  dragDamping: 0.955,
  gravity: new THREE.Vector3(0, -22, 0),
  constraintIterations: 8,
  constraintRelax: 0.42,
  bendStiffness: 0.2,
  silkSmoothing: 0.018,
  cameraZ: 36,
  pinProfile: [0, 0.23, 0.5, 0.77, 1],
};

class Particle {
  constructor(x, y, z, u, v) {
    this.pos = new THREE.Vector3(x, y, z);
    this.old = new THREE.Vector3(x, y, z);
    this.orig = new THREE.Vector3(x, y, z);
    this.acc = new THREE.Vector3();
    this.u = u;
    this.v = v;
    this.anchor = false;
  }

  addForce(force) {
    this.acc.add(force);
  }

  update(tsq) {
    const velocity = this.pos.clone().sub(this.old).multiplyScalar(CONFIG.dragDamping);
    const next = this.pos.clone().add(velocity).add(this.acc.multiplyScalar(tsq));
    this.old.copy(this.pos);
    this.pos.copy(next);
    this.acc.set(0, 0, 0);
  }
}

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(31, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, CONFIG.cameraZ);

scene.add(new THREE.AmbientLight(0x12223a, 2.1));

const keyLight = new THREE.DirectionalLight(0xd8f5ff, 1.35);
keyLight.position.set(18, 32, 28);
scene.add(keyLight);

const amberLight = new THREE.PointLight(0xff9f2e, 8, 160);
amberLight.position.set(-24, -14, 14);
scene.add(amberLight);

const cyanLight = new THREE.PointLight(0x21e7ff, 8, 160);
cyanLight.position.set(24, 18, 16);
scene.add(cyanLight);

function drawTrackedText(ctx, text, x, y, tracking) {
  if (!tracking) {
    ctx.fillText(text, x, y);
    return;
  }

  const chars = [...text];
  const width = chars.reduce((sum, char) => sum + ctx.measureText(char).width, 0) + tracking * (chars.length - 1);
  let cursor = x - width / 2;
  chars.forEach((char) => {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + tracking;
  });
}

function createBannerTexture() {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 4096;
  textureCanvas.height = 2048;
  const ctx = textureCanvas.getContext("2d");
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.anisotropy = 16;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  const draw = (logo = null) => {
    const { width, height } = textureCanvas;
    const cx = width / 2;
    const cy = height / 2;

    const base = ctx.createLinearGradient(0, 0, width, height);
    base.addColorStop(0, "#0b1830");
    base.addColorStop(0.42, "#07101f");
    base.addColorStop(1, "#02050b");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(cx, cy, 40, cx, cy, width * 0.58);
    glow.addColorStop(0, "rgba(41, 232, 255, 0.18)");
    glow.addColorStop(0.42, "rgba(255, 177, 61, 0.08)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 7) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + 36, height * 0.28, x - 32, height * 0.72, x + 18, height);
      ctx.stroke();
    }
    ctx.restore();

    drawHem(ctx, width, height);
    drawGrommets(ctx, width, height);

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
    ctx.shadowBlur = 70;
    ctx.shadowOffsetY = 16;

    if (logo) {
      const logoWidth = 380;
      const logoHeight = 330;
      ctx.drawImage(logo, cx - logoWidth / 2, cy - logoHeight / 2 - 190, logoWidth, logoHeight);
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 178px Segoe UI, sans-serif";
    ctx.fillText("McCULLOUGH DIGITAL", cx, cy + 154);

    ctx.shadowBlur = 38;
    ctx.shadowColor = "rgba(33, 231, 255, 0.55)";
    ctx.fillStyle = "#4eeaff";
    ctx.font = "800 48px Segoe UI, sans-serif";
    drawTrackedText(ctx, "INTERACTIVE FRONTEND SYSTEMS", cx, cy + 304, 12);

    ctx.strokeStyle = "#ffb13d";
    ctx.lineWidth = 5;
    ctx.shadowBlur = 24;
    ctx.shadowColor = "rgba(255, 177, 61, 0.55)";
    ctx.beginPath();
    ctx.moveTo(cx - 470, cy + 225);
    ctx.lineTo(cx + 470, cy + 225);
    ctx.stroke();
    ctx.restore();

    texture.needsUpdate = true;
  };

  draw();

  const logo = new Image();
  logo.src = `${import.meta.env.BASE_URL}assets/mccullough-digital-logo.png`;
  logo.onload = () => draw(logo);
  logo.onerror = () => draw();

  return texture;
}

function drawHem(ctx, width, height) {
  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = "rgba(255, 255, 255, 0.045)";
  ctx.fillRect(0, 0, width, 132);
  ctx.fillRect(0, height - 116, width, 116);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 3;
  [80, height - 76].forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(110, y);
    ctx.lineTo(width - 110, y);
    ctx.stroke();
  });
  ctx.restore();
}

function drawGrommets(ctx, width) {
  ctx.save();
  CONFIG.pinProfile.forEach((ratio) => {
    const x = 140 + (width - 280) * ratio;
    const y = 84;
    const ring = ctx.createRadialGradient(x, y, 8, x, y, 45);
    ring.addColorStop(0, "#0a1220");
    ring.addColorStop(0.34, "#152640");
    ring.addColorStop(0.37, "#dcefff");
    ring.addColorStop(0.55, "#7aa0b8");
    ring.addColorStop(1, "#263a50");
    ctx.fillStyle = ring;
    ctx.beginPath();
    ctx.arc(x, y, 38, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#050914";
    ctx.beginPath();
    ctx.arc(x, y, 17, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function buildCloth() {
  const particles = [];
  const constraints = [];
  const startX = -(CONFIG.clothWidth * CONFIG.restDistance) / 2;
  const startY = (CONFIG.clothHeight * CONFIG.restDistance) / 2;
  const anchors = new Set(CONFIG.pinProfile.map((p) => Math.round(p * CONFIG.clothWidth)));

  const getIdx = (u, v) => v * (CONFIG.clothWidth + 1) + u;

  for (let v = 0; v <= CONFIG.clothHeight; v += 1) {
    for (let u = 0; u <= CONFIG.clothWidth; u += 1) {
      const row = v / CONFIG.clothHeight;
      const topSag = v === 0 ? topRowSag(u) : 0;
      const particle = new Particle(
        startX + u * CONFIG.restDistance,
        startY - v * CONFIG.restDistance + topSag,
        row * 0.18,
        u,
        v,
      );
      particle.anchor = v === 0 && anchors.has(u);
      particles.push(particle);
    }
  }

  for (let v = 0; v <= CONFIG.clothHeight; v += 1) {
    for (let u = 0; u <= CONFIG.clothWidth; u += 1) {
      const i = getIdx(u, v);
      if (u < CONFIG.clothWidth) constraints.push([particles[i], particles[getIdx(u + 1, v)], CONFIG.restDistance, 1]);
      if (v < CONFIG.clothHeight) constraints.push([particles[i], particles[getIdx(u, v + 1)], CONFIG.restDistance, 1]);
      if (u < CONFIG.clothWidth && v < CONFIG.clothHeight) {
        constraints.push([particles[i], particles[getIdx(u + 1, v + 1)], CONFIG.restDistance * Math.SQRT2, 0.72]);
        constraints.push([particles[getIdx(u + 1, v)], particles[getIdx(u, v + 1)], CONFIG.restDistance * Math.SQRT2, 0.72]);
      }
      if (u < CONFIG.clothWidth - 1) constraints.push([particles[i], particles[getIdx(u + 2, v)], CONFIG.restDistance * 2, CONFIG.bendStiffness]);
      if (v < CONFIG.clothHeight - 1) constraints.push([particles[i], particles[getIdx(u, v + 2)], CONFIG.restDistance * 2, CONFIG.bendStiffness]);
    }
  }

  return { particles, constraints, getIdx };
}

function topRowSag(u) {
  const normalized = u / CONFIG.clothWidth;
  const profile = CONFIG.pinProfile;
  let left = profile[0];
  let right = profile[profile.length - 1];

  for (let i = 0; i < profile.length - 1; i += 1) {
    if (normalized >= profile[i] && normalized <= profile[i + 1]) {
      left = profile[i];
      right = profile[i + 1];
      break;
    }
  }

  const local = (normalized - left) / Math.max(right - left, 0.001);
  const droop = Math.sin(Math.PI * local);
  return -0.54 * droop;
}

const { particles, constraints, getIdx } = buildCloth();
const geometry = new THREE.PlaneGeometry(
  CONFIG.clothWidth * CONFIG.restDistance,
  CONFIG.clothHeight * CONFIG.restDistance,
  CONFIG.clothWidth,
  CONFIG.clothHeight,
);

const material = new THREE.MeshPhysicalMaterial({
  map: createBannerTexture(),
  roughness: 0.34,
  metalness: 0.18,
  clearcoat: 1,
  clearcoatRoughness: 0.16,
  side: THREE.DoubleSide,
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(-10, -10);
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
let dragParticle = null;
let postDragDampingFrames = 0;

function setPointer(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

canvas.addEventListener("pointermove", (event) => {
  setPointer(event);
});

canvas.addEventListener("pointerdown", (event) => {
  setPointer(event);
  canvas.setPointerCapture(event.pointerId);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(mesh)[0];
  if (!hit) return;

  dragParticle = particles.reduce((best, particle) => {
    const distance = particle.pos.distanceTo(hit.point);
    return distance < best.distance ? { particle, distance } : best;
  }, { particle: null, distance: Infinity }).particle;
});

canvas.addEventListener("pointerup", (event) => {
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  dragParticle = null;
  postDragDampingFrames = 20;
});

canvas.addEventListener("pointercancel", () => {
  dragParticle = null;
  postDragDampingFrames = 20;
});

function satisfyConstraint([p1, p2, restDistance, strength]) {
  const delta = p2.pos.clone().sub(p1.pos);
  const current = delta.length();
  if (!current) return;

  const correction = delta.multiplyScalar((1 - restDistance / current) * 0.5 * strength * CONFIG.constraintRelax);
  const p1Locked = p1.anchor || p1 === dragParticle;
  const p2Locked = p2.anchor || p2 === dragParticle;

  if (!p1Locked && !p2Locked) {
    p1.pos.add(correction);
    p2.pos.sub(correction);
  } else if (!p1Locked) {
    p1.pos.add(correction.multiplyScalar(2));
  } else if (!p2Locked) {
    p2.pos.sub(correction.multiplyScalar(2));
  }
}

function smoothSilk() {
  if (!CONFIG.silkSmoothing) return;

  for (let v = 1; v < CONFIG.clothHeight; v += 1) {
    for (let u = 1; u < CONFIG.clothWidth; u += 1) {
      const particle = particles[getIdx(u, v)];
      if (particle.anchor || particle === dragParticle) continue;

      const avg = particles[getIdx(u - 1, v)].pos.clone()
        .add(particles[getIdx(u + 1, v)].pos)
        .add(particles[getIdx(u, v - 1)].pos)
        .add(particles[getIdx(u, v + 1)].pos)
        .multiplyScalar(0.25);
      particle.pos.lerp(avg, CONFIG.silkSmoothing);
    }
  }
}

function updateGeometry() {
  const position = geometry.attributes.position;
  particles.forEach((particle, index) => {
    position.setXYZ(index, particle.pos.x, particle.pos.y, particle.pos.z);
  });
  position.needsUpdate = true;
  geometry.computeVertexNormals();
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.position.z = CONFIG.cameraZ;
  camera.updateProjectionMatrix();
  if (width < 720) {
    mesh.scale.setScalar(0.36);
    mesh.position.set(0, -1.15, 0);
  } else if (width < 1040) {
    mesh.scale.setScalar(0.72);
    mesh.position.set(0, -0.25, 0);
  } else {
    mesh.scale.setScalar(1);
    mesh.position.set(0, 0, 0);
  }
  renderer.setSize(width, height);
}

function animate(now = 0) {
  requestAnimationFrame(animate);
  const time = now * 0.001;
  const tsq = CONFIG.timestep * CONFIG.timestep;
  let dragTarget = null;

  if (dragParticle) {
    raycaster.setFromCamera(pointer, camera);
    dragTarget = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane, dragTarget);
  }

  particles.forEach((particle) => {
    if (particle.anchor) {
      particle.pos.copy(particle.orig);
      particle.old.copy(particle.orig);
      return;
    }

    if (particle === dragParticle && dragTarget) {
      particle.pos.lerp(dragTarget, 0.34);
      particle.old.lerp(particle.pos, 0.72);
      return;
    }

    const row = Math.pow(particle.v / CONFIG.clothHeight, 1.16);
    const wind = new THREE.Vector3(
      Math.sin(time * 0.84 + particle.u * 0.09) * 0.72 * row,
      0,
      Math.cos(time * 1.12 + particle.v * 0.14) * 1.22 * row,
    );
    const gravity = CONFIG.gravity.clone().multiplyScalar(particle.v > CONFIG.clothHeight - 3 ? 1.18 : 1);
    particle.addForce(gravity.add(wind));
    particle.update(tsq);

    if (postDragDampingFrames > 0) {
      particle.old.lerp(particle.pos, 0.18);
    }
  });

  for (let i = 0; i < CONFIG.constraintIterations; i += 1) {
    constraints.forEach(satisfyConstraint);
  }
  smoothSilk();
  if (postDragDampingFrames > 0) postDragDampingFrames -= 1;

  cyanLight.intensity = 7.6 + Math.sin(time * 1.7) * 1.2;
  amberLight.intensity = 7.2 + Math.cos(time * 1.3) * 1.3;
  updateGeometry();
  renderer.render(scene, camera);

  window.__clothDemoProbe = {
    particleCount: particles.length,
    constraintCount: constraints.length,
    anchorCount: particles.filter((p) => p.anchor).length,
    hasTexture: Boolean(material.map?.image),
    frameTime: Number(time.toFixed(3)),
    canvasSize: [renderer.domElement.width, renderer.domElement.height],
  };
}

window.addEventListener("resize", resize);
resize();
animate();
