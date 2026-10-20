import * as THREE from "three";
import { OrbitControls } from "../vendor/OrbitControls.js";
import { RoomEnvironment } from "../vendor/RoomEnvironment.js";

/* =========================================================================
   乐龄共园 · 可升降模块化种植站
   Height-Adaptive Modular Planting Station — procedural 3D demo
   Units: meters. Warm, aging-friendly industrial palette.
   ========================================================================= */

const PALETTE = {
  wood: 0xc69a6b,
  woodDark: 0x9c6f44,
  sage: 0x7fa06a,
  leaf: 0x5f8a4c,
  leafLight: 0x8fbf6b,
  cream: 0xf1ecdf,
  alu: 0xb8c0c4,
  aluDark: 0x8a9499,
  base: 0x3a4a44,
  soil: 0x53402f,
  coral: 0xe8744f,
  coralDim: 0xcf5f3c,
  skin: 0xe7b48a,
  elderCloth: 0xcf7b53,
  elderHair: 0xd8d4cc,
  youthCloth: 0x3f8f8a,
  youthHair: 0x4a3b33,
  water: 0x7cc6e8,
};

const HEIGHT = { stand: 0.95, seated: 0.72, wheel: 0.66, max: 1.0, min: 0.62 };

/* ----------------------------- renderer / scene ----------------------------- */
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const sceneBg = makeGradientTexture("#dfeaf2", "#a1b7c7");
const studioBg = makeGradientTexture("#eef1f4", "#cfd6dc");
scene.background = sceneBg;

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(3.1, 2.3, 4.0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.target.set(0, 0.8, 0);
controls.minDistance = 1.8;
controls.maxDistance = 12;
controls.maxPolarAngle = Math.PI * 0.52;
controls.autoRotateSpeed = 0.9;

/* ----------------------------- lighting ----------------------------- */
const hemi = new THREE.HemisphereLight(0xffffff, 0x6b7266, 0.55);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff2df, 2.1);
sun.position.set(4.5, 7.5, 4.0);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 30;
sun.shadow.camera.left = -8;
sun.shadow.camera.right = 8;
sun.shadow.camera.top = 8;
sun.shadow.camera.bottom = -8;
sun.shadow.bias = -0.0003;
sun.shadow.normalBias = 0.02;
scene.add(sun);

const fill = new THREE.DirectionalLight(0xcfe0ff, 0.4);
fill.position.set(-5, 3, -2);
scene.add(fill);

/* ----------------------------- material helpers ----------------------------- */
const matCache = {};
function mat(color, { rough = 0.75, metal = 0.0 } = {}) {
  const key = `${color}-${rough}-${metal}`;
  if (!matCache[key])
    matCache[key] = new THREE.MeshStandardMaterial({
      color,
      roughness: rough,
      metalness: metal,
    });
  return matCache[key];
}
const aluMat = mat(PALETTE.alu, { rough: 0.35, metal: 0.9 });
const aluDarkMat = mat(PALETTE.aluDark, { rough: 0.4, metal: 0.85 });

/* ----------------------------- ground ----------------------------- */
const deck = new THREE.Group();
scene.add(deck);

const plaza = new THREE.Mesh(
  new THREE.CircleGeometry(9, 64),
  mat(0xcdd3cc, { rough: 0.95 })
);
plaza.rotation.x = -Math.PI / 2;
plaza.receiveShadow = true;
deck.add(plaza);

// deck side rim (thickness)
const woodRim = new THREE.Mesh(
  new THREE.CylinderGeometry(3.4, 3.4, 0.12, 72),
  mat(PALETTE.woodDark, { rough: 0.85 })
);
woodRim.position.y = -0.06;
woodRim.receiveShadow = true;
deck.add(woodRim);
// textured plank top
const woodTop = new THREE.Mesh(
  new THREE.CircleGeometry(3.4, 72),
  new THREE.MeshStandardMaterial({ map: makeWoodTexture(), roughness: 0.82 })
);
woodTop.rotation.x = -Math.PI / 2;
woodTop.position.y = 0.001;
woodTop.receiveShadow = true;
deck.add(woodTop);

// ring community beds around the plaza (环形共享菜园)
const ringBeds = new THREE.Group();
deck.add(ringBeds);
for (let i = 0; i < 7; i++) {
  const a = (i / 7) * Math.PI * 2 + 0.2;
  const r = 6.1;
  const bed = makeRaisedBed();
  bed.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
  bed.rotation.y = -a + Math.PI / 2;
  ringBeds.add(bed);
}

/* ----------------------------- THE PRODUCT: planting station ----------------------------- */
const station = new THREE.Group();
scene.add(station);

// fixed base + levelers
const baseDisc = new THREE.Mesh(
  new THREE.CylinderGeometry(0.52, 0.6, 0.1, 48),
  mat(PALETTE.base, { rough: 0.5, metal: 0.3 })
);
baseDisc.position.y = 0.05;
baseDisc.castShadow = baseDisc.receiveShadow = true;
station.add(baseDisc);
for (let i = 0; i < 3; i++) {
  const a = (i / 3) * Math.PI * 2;
  const foot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 0.05, 20),
    aluDarkMat
  );
  foot.position.set(Math.cos(a) * 0.45, 0.02, Math.sin(a) * 0.45);
  foot.castShadow = true;
  station.add(foot);
}

// outer (fixed) column
const colOuter = new THREE.Mesh(
  new THREE.CylinderGeometry(0.11, 0.13, 0.55, 32),
  aluDarkMat
);
colOuter.position.y = 0.33;
colOuter.castShadow = true;
station.add(colOuter);

// actuator detail
const actuator = new THREE.Mesh(
  new THREE.BoxGeometry(0.06, 0.5, 0.06),
  mat(PALETTE.coralDim, { rough: 0.5 })
);
actuator.position.set(0.14, 0.35, 0);
station.add(actuator);

// --- lifting assembly (animated in Y) ---
const lift = new THREE.Group();
station.add(lift);

const colInner = new THREE.Mesh(
  new THREE.CylinderGeometry(0.085, 0.09, 0.5, 32),
  aluMat
);
colInner.position.y = 0.5;
colInner.castShadow = true;
lift.add(colInner);

// hub under the planter
const hub = new THREE.Mesh(
  new THREE.CylinderGeometry(0.26, 0.2, 0.09, 36),
  mat(PALETTE.cream, { rough: 0.5 })
);
hub.position.y = 0.72;
hub.castShadow = true;
lift.add(hub);

// C-shaped (horseshoe) planter — open toward +Z so a seated user reaches in
const planter = makeHorseshoePlanter(0.56, 0.34, 0.18, Math.PI * 0.42);
planter.position.y = 0.72;
lift.add(planter);

// soil + plants in the planter
const greenGroup = new THREE.Group();
greenGroup.position.y = 0.72;
lift.add(greenGroup);
scatterPlanterGreens(greenGroup, 0.45, Math.PI * 0.42);

// grab handles / armrests (safety) — two arcs on the open side
[-1, 1].forEach((s) => {
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.1, 0.022, 16, 24, Math.PI),
    aluMat
  );
  handle.rotation.z = Math.PI / 2;
  handle.rotation.y = Math.PI / 2;
  handle.position.set(s * 0.5, 0.78, 0.28);
  handle.castShadow = true;
  lift.add(handle);
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.14, 12),
    aluMat
  );
  post.position.set(s * 0.5, 0.69, 0.28);
  lift.add(post);
});

// control dock with big button + phone (ties to UI) — stays at user height, part of lift
const dock = new THREE.Group();
dock.position.set(0.0, 0.76, 0.52);
lift.add(dock);
const dockPanel = new THREE.Mesh(
  new THREE.BoxGeometry(0.26, 0.17, 0.03),
  mat(PALETTE.cream, { rough: 0.5 })
);
dockPanel.rotation.x = -0.5;
dockPanel.castShadow = true;
dock.add(dockPanel);
const phone = new THREE.Mesh(
  new THREE.BoxGeometry(0.1, 0.14, 0.012),
  mat(0x1b2b26, { rough: 0.3 })
);
phone.position.set(-0.05, 0.01, 0.03);
phone.rotation.x = -0.5;
dock.add(phone);
const phoneScreen = new THREE.Mesh(
  new THREE.PlaneGeometry(0.082, 0.12),
  phoneScreenMaterial()
);
phoneScreen.position.set(-0.05, 0.013, 0.0375);
phoneScreen.rotation.x = -0.5;
dock.add(phoneScreen);
const bigBtn = new THREE.Mesh(
  new THREE.CylinderGeometry(0.035, 0.035, 0.02, 24),
  mat(PALETTE.coral, { rough: 0.4 })
);
bigBtn.rotation.x = Math.PI / 2 - 0.5;
bigBtn.position.set(0.07, 0.0, 0.03);
dock.add(bigBtn);

// fold-out seat on the open side
const seat = new THREE.Group();
seat.position.set(0, 0.46, 0.75);
station.add(seat);
const seatPad = new THREE.Mesh(
  new THREE.CylinderGeometry(0.17, 0.17, 0.05, 28),
  mat(PALETTE.coral, { rough: 0.6 })
);
seatPad.castShadow = true;
seat.add(seatPad);
const seatLeg = new THREE.Mesh(
  new THREE.CylinderGeometry(0.03, 0.03, 0.46, 16),
  aluMat
);
seatLeg.position.y = -0.23;
seat.add(seatLeg);

/* ----------------------------- vertical greening / social wall ----------------------------- */
const wall = buildWall();
wall.position.set(-0.2, 0, -2.6);
scene.add(wall);

/* ----------------------------- figures ----------------------------- */
const elder = makeElderSeated();
elder.position.set(0.0, 0, 1.15);
elder.rotation.y = Math.PI;
scene.add(elder);

const youth = makeYouthStanding();
youth.position.set(-1.9, 0, -1.5);
youth.rotation.y = Math.PI * 0.7;
scene.add(youth);

/* ----------------------------- scenery ----------------------------- */
scene.add(makeTree(4.6, -3.2));
scene.add(makeBench(2.6, -1.3));

/* ----------------------------- water particles ----------------------------- */
const dropCount = 60;
const dropGeo = new THREE.BufferGeometry();
const dropPos = new Float32Array(dropCount * 3);
for (let i = 0; i < dropCount; i++) resetDrop(i, true);
dropGeo.setAttribute("position", new THREE.BufferAttribute(dropPos, 3));
const drops = new THREE.Points(
  dropGeo,
  new THREE.PointsMaterial({
    color: PALETTE.water,
    size: 0.03,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  })
);
drops.visible = false;
lift.add(drops);
function resetDrop(i, spread) {
  const a = Math.random() * Math.PI * 2;
  const r = 0.18 + Math.random() * 0.22;
  dropPos[i * 3] = Math.cos(a) * r;
  dropPos[i * 3 + 1] = (spread ? Math.random() : 1) * 0.35 + 0.05;
  dropPos[i * 3 + 2] = Math.sin(a) * r;
}

/* ----------------------------- annotations (part callouts) ----------------------------- */
const annoRoot = document.getElementById("annotations");
const annotations = [
  { text: "升降立柱 · 电动推杆", pos: new THREE.Vector3(0.14, 0.5, 0) },
  { text: "C 型种植槽 · 免弯腰可及中心", pos: new THREE.Vector3(0, 0.95, -0.3) },
  { text: "助力扶手", pos: new THREE.Vector3(0.5, 0.82, 0.28) },
  { text: "折叠坐垫", pos: new THREE.Vector3(0, 0.5, 0.75) },
  { text: "手机操控坞 · 一键呼叫", pos: new THREE.Vector3(0.07, 0.78, 0.52) },
  { text: "模块化垂直绿化社交墙", pos: new THREE.Vector3(-0.2, 2.1, -2.6) },
];
annotations.forEach((a) => {
  const el = document.createElement("div");
  el.className = "anno";
  el.innerHTML = `<span class="anno-dot"></span><span class="anno-text">${a.text}</span>`;
  annoRoot.appendChild(el);
  a.el = el;
});
let labelsVisible = true;

/* ----------------------------- animation state ----------------------------- */
const state = {
  playing: true,
  elapsed: 0,
  liftY: 0, // offset added to lift (0 => seated base). animated.
  targetManual: null, // when user drives height manually
  pure: false,
};
const clock = new THREE.Clock();
const DUR = 15; // seconds per loop
const phaseLabelEl = document.querySelector("[data-phase-label]");
const captionEl = document.querySelector("[data-caption]");
const heightReadout = document.querySelector("[data-height-readout]");

// lift.position.y moves the whole assembly. seated=0 (planter top 0.72), standing raises by +0.23
function applyLift(y) {
  lift.position.y = y;
  seat.visible = y < 0.12; // seat relevant when lowered for seated use
  const topCm = Math.round((HEIGHT.seated + y) * 100);
  if (heightReadout) heightReadout.textContent = `台面 ${topCm} cm`;
}

const phases = [
  { t: 0.0, label: "老人靠近", cap: "老人走近 → 种植站识别到使用者，准备降到就座高度" },
  { t: 0.22, label: "自动降台", cap: "电动升降立柱把 C 型种植槽降到 72cm 就座高度，免弯腰" },
  { t: 0.45, label: "就座照料", cap: "坐着浇水、松土 —— 全程不弯腰、不下蹲，扶手提供支撑" },
  { t: 0.68, label: "邻里加入", cap: "青年志愿者走到社交墙，代际协作、分担重活" },
  { t: 0.85, label: "模块轮换", cap: "垂直绿化墙模块化、可季度轮换，社区共同营造" },
];

/* ----------------------------- UI wiring ----------------------------- */
const body = document.body;
document.querySelector(".scene-controls").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.act === "play") {
    state.playing = true;
    state.targetManual = null;
    controls.autoRotate = true;
  } else if (b.dataset.act === "pause") {
    state.playing = false;
    controls.autoRotate = false;
  } else if (b.dataset.act === "raise") {
    state.playing = false;
    controls.autoRotate = false;
    state.targetManual = Math.min(
      (state.targetManual ?? state.liftY) + 0.06,
      HEIGHT.max - HEIGHT.seated
    );
  } else if (b.dataset.act === "lower") {
    state.playing = false;
    controls.autoRotate = false;
    state.targetManual = Math.max(
      (state.targetManual ?? state.liftY) - 0.06,
      HEIGHT.min - HEIGHT.seated
    );
  } else if (b.dataset.act === "labels") {
    labelsVisible = !labelsVisible;
  } else if (b.dataset.act === "pure") {
    setPure(!state.pure);
  } else if (b.dataset.act === "shot") {
    exportShot();
  } else if (b.dataset.view) {
    setView(b.dataset.view);
  }
});

function setPure(on) {
  state.pure = on;
  body.classList.toggle("pure", on);
  scene.background = on ? studioBg : sceneBg;
  deck.visible = !on ? true : true; // keep deck; just cleaner bg
}

function setView(v) {
  controls.autoRotate = false;
  const tgt = new THREE.Vector3(0, 0.85, 0);
  const views = {
    persp: [3.1, 2.3, 4.0],
    front: [0.01, 1.1, 4.6],
    side: [4.8, 1.1, 0.2],
    top: [0.01, 6.2, 0.6],
    ergo: [3.4, 1.0, 2.4],
  };
  const p = views[v] || views.persp;
  camera.position.set(p[0], p[1], p[2]);
  controls.target.copy(v === "top" ? new THREE.Vector3(0, 0.4, 0) : tgt);
  controls.update();
}

function exportShot() {
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = `grow-together-render-${Date.now()}.png`;
  a.click();
}

// expose a small API for automated capture/testing
window.__demo = { setView, setPure, play: () => (state.playing = true), pause: () => (state.playing = false), exportShot, scene, camera };

/* ----------------------------- loop ----------------------------- */
const _v = new THREE.Vector3();
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (state.playing) state.elapsed = (state.elapsed + dt) % DUR;
  const p = state.elapsed / DUR;

  // ---- table height timeline ----
  let targetLift;
  if (state.targetManual !== null) {
    targetLift = state.targetManual;
  } else {
    // start raised (standing), descend to seated during phase, stay seated
    const descend = smoothstep(0.1, 0.3, p); // 0->1
    targetLift = (1 - descend) * (HEIGHT.stand - HEIGHT.seated);
  }
  state.liftY += (targetLift - state.liftY) * Math.min(1, dt * 4);
  applyLift(state.liftY);

  // ---- watering during seated phase ----
  const watering = state.targetManual === null && p > 0.45 && p < 0.66;
  drops.visible = watering;
  if (watering) {
    for (let i = 0; i < dropCount; i++) {
      dropPos[i * 3 + 1] -= dt * 0.9;
      if (dropPos[i * 3 + 1] < 0.02) resetDrop(i, false);
    }
    dropGeo.attributes.position.needsUpdate = true;
  }

  // ---- plant sway ----
  greenGroup.children.forEach((c, i) => {
    c.rotation.z = Math.sin(state.elapsed * 1.5 + i) * 0.04;
  });

  // ---- youth walks toward wall during later phase ----
  const walk = smoothstep(0.6, 0.78, p);
  youth.position.set(-1.9 + walk * 0.8, 0, -1.5 + walk * 0.6);
  youth.rotation.y = Math.PI * 0.7;
  youth.visible = true;
  // gentle youth arm motion near wall
  if (youth.userData.arm) youth.userData.arm.rotation.x = -0.3 - walk * 0.9;

  // ---- wall module rotation (轮换) ----
  if (wall.userData.swapModule) {
    const sw = smoothstep(0.84, 0.98, p);
    wall.userData.swapModule.rotation.y = sw * Math.PI;
  }

  // ---- elder subtle tending motion ----
  if (elder.userData.arm) {
    const tend = state.targetManual === null && p > 0.45 && p < 0.66 ? 1 : 0;
    elder.userData.arm.rotation.x =
      -0.8 - (tend ? Math.sin(state.elapsed * 3) * 0.25 + 0.3 : 0);
  }

  // ---- phase label ----
  if (state.targetManual === null) {
    let ph = phases[0];
    for (const q of phases) if (p >= q.t) ph = q;
    if (phaseLabelEl) phaseLabelEl.textContent = ph.label;
    if (captionEl) captionEl.textContent = ph.cap;
  } else {
    if (phaseLabelEl) phaseLabelEl.textContent = "手动调节";
    if (captionEl)
      captionEl.textContent = "手机 / 大按钮即可调节台面高度：站立、就座、轮椅三档人因高度";
  }

  controls.update();
  renderer.render(scene, camera);

  // ---- annotation projection ----
  updateAnnotations();
  requestAnimationFrame(tick);
}

function updateAnnotations() {
  const show = labelsVisible && !state.pure;
  const rect = renderer.domElement.getBoundingClientRect();
  annotations.forEach((a) => {
    if (!show) {
      a.el.style.display = "none";
      return;
    }
    _v.copy(a.pos).project(camera);
    const behind = _v.z > 1;
    const x = (_v.x * 0.5 + 0.5) * rect.width;
    const y = (-_v.y * 0.5 + 0.5) * rect.height;
    if (behind || x < 0 || x > rect.width || y < 0 || y > rect.height) {
      a.el.style.display = "none";
    } else {
      a.el.style.display = "flex";
      a.el.style.transform = `translate(${x}px, ${y}px)`;
    }
  });
}

/* ----------------------------- resize ----------------------------- */
function resize() {
  const root = document.getElementById("scene-root");
  const w = root.clientWidth;
  const h = root.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

const loadingEl = document.querySelector("[data-loading]");
if (loadingEl) loadingEl.style.display = "none";

// ---- capture URL params (for reproducible render stills) ----
(function applyCaptureParams() {
  const q = new URLSearchParams(location.search);
  // lightweight embedded preview (used by the overview page iframe)
  if (q.get("embed") === "1") {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    state.elapsed = 0.5 * DUR; // seated pose; timeline paused but settles to seated
    state.playing = false;
    controls.autoRotate = false;
  }
  if (q.has("t")) {
    state.elapsed = Math.max(0, Math.min(1, parseFloat(q.get("t")))) * DUR;
  }
  if (q.get("play") === "0") {
    state.playing = false;
    controls.autoRotate = false;
  }
  if (q.get("pure") === "1") setPure(true);
  if (q.has("view")) setView(q.get("view"));
})();

tick();

/* =========================================================================
   builders
   ========================================================================= */
function makeGradientTexture(top, bottom) {
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 256;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  g.fillStyle = grad;
  g.fillRect(0, 0, 16, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeWoodTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#c69a6b";
  g.fillRect(0, 0, 512, 512);
  const plankH = 64;
  for (let y = 0; y < 512; y += plankH) {
    // plank base tint variation
    g.fillStyle = `rgba(${150 + Math.random() * 30}, ${110 + Math.random() * 25}, ${70 + Math.random() * 20}, 0.25)`;
    g.fillRect(0, y, 512, plankH);
    // seam
    g.strokeStyle = "rgba(120, 82, 48, 0.65)";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(512, y);
    g.stroke();
    // grain streaks
    g.strokeStyle = "rgba(120, 82, 48, 0.14)";
    g.lineWidth = 1;
    for (let k = 0; k < 6; k++) {
      const gy = y + 8 + Math.random() * (plankH - 16);
      g.beginPath();
      g.moveTo(0, gy);
      g.bezierCurveTo(170, gy + (Math.random() - 0.5) * 6, 340, gy + (Math.random() - 0.5) * 6, 512, gy);
      g.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function phoneScreenMaterial() {
  const c = document.createElement("canvas");
  c.width = 164;
  c.height = 240;
  const g = c.getContext("2d");
  g.fillStyle = "#f4efe4";
  g.fillRect(0, 0, 164, 240);
  g.fillStyle = "#2f6b4f";
  g.fillRect(0, 0, 164, 54);
  g.fillStyle = "#ffffff";
  g.font = "bold 20px sans-serif";
  g.fillText("今日照料", 16, 36);
  g.fillStyle = "#e8744f";
  roundRect(g, 16, 150, 132, 60, 12);
  g.fill();
  g.fillStyle = "#ffffff";
  g.font = "bold 24px sans-serif";
  g.fillText("去浇水", 36, 190);
  g.fillStyle = "#d8e4d4";
  roundRect(g, 16, 74, 132, 60, 12);
  g.fill();
  g.fillStyle = "#2f6b4f";
  g.font = "20px sans-serif";
  g.fillText("菠菜 · 今天", 28, 110);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4, emissive: 0x222222, emissiveMap: tex, emissiveIntensity: 0.35 });
}
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function makeHorseshoePlanter(outer, inner, h, gapHalf) {
  const shape = new THREE.Shape();
  const a0 = -Math.PI / 2 + gapHalf;
  const a1 = -Math.PI / 2 - gapHalf + Math.PI * 2;
  shape.absarc(0, 0, outer, a0, a1, false);
  shape.absarc(0, 0, inner, a1, a0, true);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: h,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
    curveSegments: 48,
  });
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, mat(PALETTE.cream, { rough: 0.6 }));
  m.castShadow = m.receiveShadow = true;
  // soil fill
  const soilShape = new THREE.Shape();
  soilShape.absarc(0, 0, outer - 0.05, a0, a1, false);
  soilShape.absarc(0, 0, inner + 0.05, a1, a0, true);
  const soilGeo = new THREE.ExtrudeGeometry(soilShape, {
    depth: 0.05,
    bevelEnabled: false,
    curveSegments: 48,
  });
  soilGeo.rotateX(-Math.PI / 2);
  const soil = new THREE.Mesh(soilGeo, mat(PALETTE.soil, { rough: 1.0 }));
  soil.position.y = h - 0.02;
  const g = new THREE.Group();
  g.add(m, soil);
  return g;
}

function scatterPlanterGreens(group, midR, gapHalf) {
  const n = 14;
  for (let i = 0; i < n; i++) {
    const frac = i / n;
    const ang = -Math.PI / 2 + gapHalf + frac * (Math.PI * 2 - gapHalf * 2);
    const r = midR + (Math.random() - 0.5) * 0.08;
    const plant = Math.random() > 0.5 ? makeCabbage() : makeLettuce();
    plant.position.set(Math.cos(ang) * r, 0.17, Math.sin(ang) * r);
    group.add(plant);
  }
}
function makeCabbage() {
  const g = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.07, 0),
    mat(PALETTE.leafLight, { rough: 0.85 })
  );
  core.scale.y = 0.8;
  core.castShadow = true;
  g.add(core);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 6),
      mat(PALETTE.leaf, { rough: 0.9 })
    );
    leaf.scale.set(1.1, 0.5, 1.1);
    leaf.position.set(Math.cos(a) * 0.05, -0.01, Math.sin(a) * 0.05);
    g.add(leaf);
  }
  return g;
}
function makeLettuce() {
  const g = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const leaf = new THREE.Mesh(
      new THREE.ConeGeometry(0.035, 0.12, 6),
      mat(i % 2 ? PALETTE.leaf : PALETTE.leafLight, { rough: 0.9 })
    );
    leaf.position.set(Math.cos(a) * 0.03, 0.04, Math.sin(a) * 0.03);
    leaf.rotation.z = Math.cos(a) * 0.5;
    leaf.rotation.x = Math.sin(a) * 0.5;
    leaf.castShadow = true;
    g.add(leaf);
  }
  return g;
}

function makeRaisedBed() {
  const g = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.4, 0.7),
    mat(PALETTE.woodDark, { rough: 0.85 })
  );
  box.position.y = 0.2;
  box.castShadow = box.receiveShadow = true;
  g.add(box);
  const soil = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.08, 0.6),
    mat(PALETTE.soil, { rough: 1 })
  );
  soil.position.y = 0.4;
  g.add(soil);
  for (let i = 0; i < 6; i++) {
    const p = Math.random() > 0.5 ? makeCabbage() : makeLettuce();
    p.position.set(-0.6 + (i % 3) * 0.6, 0.46, i < 3 ? -0.15 : 0.15);
    p.scale.setScalar(1.2);
    g.add(p);
  }
  return g;
}

function buildWall() {
  const g = new THREE.Group();
  const frameMat = aluMat;
  const W = 4.2;
  const H = 2.3;
  // posts + rails
  const postGeo = new THREE.BoxGeometry(0.08, H, 0.08);
  [-W / 2, W / 2].forEach((x) => {
    const p = new THREE.Mesh(postGeo, frameMat);
    p.position.set(x, H / 2, 0);
    p.castShadow = true;
    g.add(p);
  });
  for (let i = 0; i < 4; i++) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(W, 0.06, 0.06), frameMat);
    rail.position.set(0, 0.3 + i * ((H - 0.3) / 3), 0);
    g.add(rail);
  }
  // geometric planting modules (diamond + square), alternating planted/empty
  const cols = 6;
  const rows = 3;
  let swap = null;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = -W / 2 + 0.5 + c * ((W - 1) / (cols - 1));
      const y = 0.55 + r * 0.62;
      const planted = (r + c) % 2 === 0;
      const mod = new THREE.Group();
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.46, 0.14),
        mat(planted ? PALETTE.sage : PALETTE.cream, { rough: 0.7 })
      );
      panel.rotation.z = Math.PI / 4; // diamond
      panel.castShadow = true;
      mod.add(panel);
      if (planted) {
        for (let k = 0; k < 3; k++) {
          const pl = makeLettuce();
          pl.scale.setScalar(0.8);
          pl.position.set((k - 1) * 0.12, 0.02, 0.1);
          mod.add(pl);
        }
      }
      mod.position.set(x, y, 0.05);
      g.add(mod);
      if (r === 1 && c === 2) swap = mod; // the module that rotates (轮换)
    }
  }
  g.userData.swapModule = swap;
  // drip line
  const drip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, W, 8),
    mat(PALETTE.coral, { rough: 0.5 })
  );
  drip.rotation.z = Math.PI / 2;
  drip.position.set(0, H - 0.05, 0.12);
  g.add(drip);
  return g;
}

function makeTree(x, z) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.18, 1.6, 12),
    mat(PALETTE.woodDark, { rough: 0.95 })
  );
  trunk.position.y = 0.8;
  trunk.castShadow = true;
  g.add(trunk);
  [[0, 1.9, 0, 0.9], [0.4, 1.7, 0.3, 0.6], [-0.4, 1.75, -0.2, 0.55]].forEach(
    ([dx, dy, dz, r]) => {
      const f = new THREE.Mesh(
        new THREE.IcosahedronGeometry(r, 1),
        mat(PALETTE.leaf, { rough: 1 })
      );
      f.position.set(dx, dy, dz);
      f.castShadow = true;
      g.add(f);
    }
  );
  g.position.set(x, 0, z);
  return g;
}

function makeBench(x, z) {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.08, 0.4),
    mat(PALETTE.wood, { rough: 0.8 })
  );
  seat.position.y = 0.45;
  seat.castShadow = true;
  g.add(seat);
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.35, 0.07),
    mat(PALETTE.wood, { rough: 0.8 })
  );
  back.position.set(0, 0.65, -0.18);
  g.add(back);
  [-0.5, 0.5].forEach((sx) => {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.45, 0.35),
      aluDarkMat
    );
    leg.position.set(sx, 0.22, 0);
    g.add(leg);
  });
  g.position.set(x, 0, z);
  g.rotation.y = -0.6;
  return g;
}

function makeElderSeated() {
  const g = new THREE.Group();
  const cloth = mat(PALETTE.elderCloth, { rough: 0.9 });
  const skin = mat(PALETTE.skin, { rough: 0.8 });
  // hips
  const hips = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), cloth);
  hips.position.y = 0.46;
  hips.scale.set(1, 0.8, 1);
  g.add(hips);
  // torso leaning slightly forward
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.28, 6, 12), cloth);
  torso.position.set(0, 0.68, -0.02);
  torso.rotation.x = 0.18;
  torso.castShadow = true;
  g.add(torso);
  // head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 16), skin);
  head.position.set(0, 0.95, 0.02);
  head.castShadow = true;
  g.add(head);
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.125, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.6),
    mat(PALETTE.elderHair, { rough: 1 })
  );
  hair.position.copy(head.position);
  g.add(hair);
  // thighs forward
  [-0.09, 0.09].forEach((sx) => {
    const thigh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.075, 0.26, 6, 10),
      mat(0x55606b, { rough: 0.9 })
    );
    thigh.position.set(sx, 0.44, 0.2);
    thigh.rotation.x = Math.PI / 2;
    g.add(thigh);
    const shin = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.07, 0.26, 6, 10),
      mat(0x55606b, { rough: 0.9 })
    );
    shin.position.set(sx, 0.22, 0.33);
    g.add(shin);
  });
  // tending arm (animated)
  const arm = new THREE.Group();
  arm.position.set(0.12, 0.78, 0.0);
  const upper = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.05, 0.22, 6, 10),
    cloth
  );
  upper.position.set(0.02, -0.12, 0.08);
  upper.rotation.x = 0.6;
  arm.add(upper);
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), skin);
  hand.position.set(0.04, -0.26, 0.2);
  arm.add(hand);
  arm.rotation.x = -0.8;
  g.add(arm);
  g.userData.arm = arm;
  g.traverse((o) => (o.castShadow = o.isMesh ? true : o.castShadow));
  return g;
}

function makeYouthStanding() {
  const g = new THREE.Group();
  const cloth = mat(PALETTE.youthCloth, { rough: 0.85 });
  const skin = mat(PALETTE.skin, { rough: 0.8 });
  const legMat = mat(0x33414d, { rough: 0.9 });
  [-0.09, 0.09].forEach((sx) => {
    const leg = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.08, 0.6, 6, 10),
      legMat
    );
    leg.position.set(sx, 0.45, 0);
    leg.castShadow = true;
    g.add(leg);
  });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.4, 6, 12), cloth);
  torso.position.y = 1.05;
  torso.castShadow = true;
  g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 16), skin);
  head.position.y = 1.42;
  head.castShadow = true;
  g.add(head);
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.135, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.65),
    mat(PALETTE.youthHair, { rough: 1 })
  );
  hair.position.copy(head.position);
  g.add(hair);
  // static arm
  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.4, 6, 10), cloth);
  armL.position.set(-0.22, 1.05, 0);
  armL.rotation.z = 0.15;
  g.add(armL);
  // moving arm (reaches to wall)
  const arm = new THREE.Group();
  arm.position.set(0.22, 1.22, 0);
  const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.4, 6, 10), cloth);
  upper.position.y = -0.2;
  arm.add(upper);
  arm.rotation.x = -0.3;
  g.add(arm);
  g.userData.arm = arm;
  return g;
}

/* ----------------------------- utils ----------------------------- */
function smoothstep(a, b, x) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
