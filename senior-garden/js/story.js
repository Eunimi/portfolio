import * as THREE from "three";
import { RoomEnvironment } from "../vendor/RoomEnvironment.js";

/* =========================================================================
   乐龄共园 · 连环动画（滚动叙事）
   Scroll-driven cinematic story. Each 幕 = one act with its own camera
   framing + animation. Redesigned station: furniture warmth + industrial tech.
   ========================================================================= */

const C = {
  wood: 0xca9d6d,
  woodDark: 0x9a6e44,
  cream: 0xf2ede1,
  alu: 0xc0c7cb,
  aluDark: 0x889196,
  base: 0x3a4a44,
  fabric: 0xd98b5f,
  fabricWarm: 0xe0a06f,
  soil: 0x53402f,
  leaf: 0x5f8a4c,
  leafLight: 0x8fbf6b,
  tech: 0x37b6c0,
  coral: 0xe8744f,
  skin: 0xe7b48a,
  elderCloth: 0xcf7b53,
  elderHair: 0xd8d4cc,
  youthCloth: 0x3f8f8a,
  youthHair: 0x4a3b33,
  water: 0x7cc6e8,
};
const SEAT_LIFT = 0.0; // lift offset at seated
const STAND_LIFT = 0.24; // lift offset at standing

/* ----------------------------- renderer / scene ----------------------------- */
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = gradientTex("#dce7ef", "#aec0cd");
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(2.6, 1.9, 3.8);

/* ----------------------------- lights ----------------------------- */
scene.add(new THREE.HemisphereLight(0xffffff, 0x6b7266, 0.55));
const sun = new THREE.DirectionalLight(0xfff2df, 2.1);
sun.position.set(4.5, 7.5, 4.0);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { near: 1, far: 30, left: -8, right: 8, top: 8, bottom: -8 });
sun.shadow.bias = -0.0003;
sun.shadow.normalBias = 0.02;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xcfe0ff, 0.4);
fill.position.set(-5, 3, -2);
scene.add(fill);

/* ----------------------------- materials ----------------------------- */
const mats = {};
function M(color, o = {}) {
  const k = color + JSON.stringify(o);
  if (!mats[k]) mats[k] = new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.75, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, transparent: !!o.t, opacity: o.o ?? 1 });
  return mats[k];
}
const aluMat = M(C.alu, { r: 0.32, m: 0.9 });
const aluDarkMat = M(C.aluDark, { r: 0.4, m: 0.85 });
const woodMat = new THREE.MeshStandardMaterial({ map: woodTex(), roughness: 0.72 });

/* ----------------------------- ground ----------------------------- */
const deck = new THREE.Group();
scene.add(deck);
const plaza = new THREE.Mesh(new THREE.CircleGeometry(9, 64), M(0xccd2cb, { r: 0.96 }));
plaza.rotation.x = -Math.PI / 2;
plaza.receiveShadow = true;
deck.add(plaza);
const woodRim = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.12, 72), M(C.woodDark, { r: 0.85 }));
woodRim.position.y = -0.06;
woodRim.receiveShadow = true;
deck.add(woodRim);
const woodTop = new THREE.Mesh(new THREE.CircleGeometry(3.4, 72), new THREE.MeshStandardMaterial({ map: woodTex(), roughness: 0.82 }));
woodTop.rotation.x = -Math.PI / 2;
woodTop.position.y = 0.001;
woodTop.receiveShadow = true;
deck.add(woodTop);

/* ----------------------------- THE STATION (redesigned) ----------------------------- */
const station = new THREE.Group();
scene.add(station);
const S = {}; // part refs

// --- base: warm wood pedestal + metal trim ring + feet (+ hidden counterweight) ---
const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.56, 0.16, 48), woodMat);
pedestal.position.y = 0.08;
pedestal.castShadow = pedestal.receiveShadow = true;
station.add(pedestal);
const trim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.028, 16, 48), aluMat);
trim.rotation.x = Math.PI / 2;
trim.position.y = 0.16;
station.add(trim);
for (let i = 0; i < 3; i++) {
  const a = (i / 3) * Math.PI * 2 + 0.5;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 0.05, 20), aluDarkMat);
  foot.position.set(Math.cos(a) * 0.46, 0.025, Math.sin(a) * 0.46);
  foot.castShadow = true;
  station.add(foot);
}

// --- outer column sleeve (wood-clad, fades to reveal mechanism) ---
const outerSleeve = new THREE.Group();
const sleeveWood = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.13, 0.62, 32), woodMat.clone());
sleeveWood.position.y = 0.46;
sleeveWood.castShadow = true;
outerSleeve.add(sleeveWood);
const sleeveCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 32), aluMat.clone());
sleeveCollar.position.y = 0.76;
outerSleeve.add(sleeveCollar);
station.add(outerSleeve);
S.outerSleeve = outerSleeve;

// --- mechanism: lead screw + nut + motor (revealed on cutaway) ---
const mech = new THREE.Group();
const screwCurvePts = [];
for (let i = 0; i <= 120; i++) {
  const f = i / 120;
  const ang = f * Math.PI * 2 * 11;
  const y = 0.2 + f * 0.52;
  screwCurvePts.push(new THREE.Vector3(Math.cos(ang) * 0.045, y, Math.sin(ang) * 0.045));
}
const screwCurve = new THREE.CatmullRomCurve3(screwCurvePts);
const screwMesh = new THREE.Mesh(new THREE.TubeGeometry(screwCurve, 240, 0.013, 8, false), aluMat.clone());
const screwCore = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.56, 16), aluDarkMat.clone());
screwCore.position.y = 0.48;
const screwSpin = new THREE.Group();
screwSpin.add(screwMesh, screwCore);
mech.add(screwSpin);
const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 20), M(C.base, { r: 0.4, m: 0.5 }).clone());
motor.position.y = 0.13;
mech.add(motor);
const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.055, 24), M(C.tech, { r: 0.4, m: 0.6, e: C.tech, ei: 0.3 }).clone());
nut.position.y = 0.35;
mech.add(nut);
station.add(mech);
S.mech = mech;
S.screwSpin = screwSpin;
S.nut = nut;
// upward force arrow (shown in lift act)
const forceArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0.74, 0), 0.3, C.tech, 0.09, 0.05);
station.add(forceArrow);
S.forceArrow = forceArrow;

// --- lift assembly (animated in Y) ---
const lift = new THREE.Group();
station.add(lift);
S.lift = lift;
const innerPost = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.076, 0.76, 32), aluMat);
innerPost.position.y = 0.42;
innerPost.castShadow = true;
lift.add(innerPost);
// LED status ring (tech accent)
const ledRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 12, 48), M(C.tech, { e: C.tech, ei: 0.8, r: 0.4 }).clone());
ledRing.rotation.x = Math.PI / 2;
ledRing.position.y = 0.69;
lift.add(ledRing);
S.led = ledRing;
// hub
const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.19, 0.08, 36), M(C.cream, { r: 0.5 }));
hub.position.y = 0.73;
hub.castShadow = true;
lift.add(hub);
// C-shaped planter (wood rim + cream + soil + greens)
const planter = makeHorseshoePlanter(0.56, 0.33, 0.17, Math.PI * 0.42);
planter.position.y = 0.74;
lift.add(planter);
const greens = new THREE.Group();
greens.position.y = 0.74;
lift.add(greens);
scatterGreens(greens, 0.44, Math.PI * 0.42);
S.greens = greens;
// grab handles (wood-topped alu rails)
[-1, 1].forEach((s) => {
  const rail = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 14, 24, Math.PI), aluMat);
  rail.rotation.z = Math.PI / 2;
  rail.rotation.y = Math.PI / 2;
  rail.position.set(s * 0.5, 0.82, 0.3);
  rail.castShadow = true;
  lift.add(rail);
  const grip = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.024, 14, 24, Math.PI * 0.6), woodMat.clone());
  grip.rotation.z = Math.PI / 2;
  grip.rotation.y = Math.PI / 2;
  grip.position.set(s * 0.5, 0.82, 0.3);
  lift.add(grip);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 12), aluMat);
  post.position.set(s * 0.5, 0.72, 0.3);
  lift.add(post);
});
// tech dock: tilted status screen on stalk + phone + big button
const dock = new THREE.Group();
dock.position.set(0.24, 0.73, 0.42);
lift.add(dock);
S.dock = dock;
const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.16, 10), aluMat);
stalk.position.y = -0.02;
dock.add(stalk);
const screenBezel = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.11, 0.022), M(C.base, { r: 0.4 }));
screenBezel.position.y = 0.1;
screenBezel.rotation.x = -0.45;
dock.add(screenBezel);
const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.092), screenMat());
screen.position.set(0, 0.106, 0.016);
screen.rotation.x = -0.45;
dock.add(screen);
const bigBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 24), M(C.coral, { r: 0.4 }).clone());
bigBtn.rotation.x = Math.PI / 2;
bigBtn.position.set(-0.46, 0.09, -0.1);
bigBtn.scale.set(1, 1, 1);
dock.add(bigBtn);
S.bigBtn = bigBtn;

// --- fold-out seat (fixed to base; stays at sitting height) ---
const seat = new THREE.Group();
seat.position.set(0, 0.46, 0.78);
station.add(seat);
const seatArm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.4), aluMat);
seatArm.position.set(0, 0, -0.2);
seat.add(seatArm);
const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.055, 28), M(C.fabric, { r: 0.95 }));
cushion.castShadow = true;
const cushionTop = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 28), M(C.fabricWarm, { r: 0.95 }));
cushionTop.position.y = 0.035;
seat.add(cushion, cushionTop);

/* ----------------------------- physics helpers ----------------------------- */
// reach envelope (seated comfortable reach fan)
const reach = new THREE.Group();
const fan = new THREE.Mesh(
  new THREE.CircleGeometry(0.62, 40, Math.PI * 0.2, Math.PI * 0.6),
  M(C.tech, { t: true, o: 0.22, r: 0.6, e: C.tech, ei: 0.15 }).clone()
);
fan.material.side = THREE.DoubleSide;
fan.rotation.x = -Math.PI / 2;
fan.position.set(0, 0.76, 0.86);
reach.add(fan);
const fanEdge = new THREE.Mesh(
  new THREE.RingGeometry(0.6, 0.63, 40, 1, Math.PI * 0.2, Math.PI * 0.6),
  M(C.tech, { t: true, o: 0.8, e: C.tech, ei: 0.4 }).clone()
);
fanEdge.rotation.x = -Math.PI / 2;
fanEdge.position.set(0, 0.765, 0.86);
reach.add(fanEdge);
scene.add(reach);
S.reach = reach;

// stability group: footprint ring + CoG + plumb line
const stab = new THREE.Group();
const footprint = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.57, 48), M(C.tech, { t: true, o: 0.6, e: C.tech, ei: 0.4 }).clone());
footprint.rotation.x = -Math.PI / 2;
footprint.position.y = 0.02;
stab.add(footprint);
const cogPos = new THREE.Vector3(0, 0.6, 0.12);
const cog = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 16), M(C.coral, { e: C.coral, ei: 0.5 }).clone());
cog.position.copy(cogPos);
stab.add(cog);
const plumb = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, cogPos.y, 8), M(C.coral, { t: true, o: 0.8 }).clone());
plumb.position.set(cogPos.x, cogPos.y / 2, cogPos.z);
stab.add(plumb);
const hit = new THREE.Mesh(new THREE.CircleGeometry(0.06, 24), M(C.coral, { t: true, o: 0.9, e: C.coral, ei: 0.4 }).clone());
hit.rotation.x = -Math.PI / 2;
hit.position.set(cogPos.x, 0.025, cogPos.z);
stab.add(hit);
const loadArrow = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 1.0, 0.2), 0.26, C.coral, 0.08, 0.05);
stab.add(loadArrow);
scene.add(stab);
S.stab = stab;

// record designed opacities so fades preserve translucency, then start hidden
[reach, stab, mech, forceArrow].forEach((grp) =>
  grp.traverse((n) => {
    if ((n.isMesh || n.isLine) && n.material) n.material.userData.baseO = n.material.opacity;
  })
);
reach.visible = false;
stab.visible = false;
mech.visible = false;
forceArrow.visible = false;

/* ----------------------------- wall / beds / scenery ----------------------------- */
const wall = buildWall();
wall.position.set(-0.3, 0, -2.7);
scene.add(wall);

const groundBed = makeGroundBed();
groundBed.position.set(1.9, 0, 0.7);
scene.add(groundBed);
S.groundBed = groundBed;

scene.add(makeTree(4.6, -3.2));
scene.add(makeBench(-2.7, -1.2));
for (let i = 0; i < 5; i++) {
  const a = (i / 5) * Math.PI * 2 + 0.3;
  const bed = makeRaisedBed();
  bed.position.set(Math.cos(a) * 6.2, 0, Math.sin(a) * 6.2);
  bed.rotation.y = -a + Math.PI / 2;
  deck.add(bed);
}

/* ----------------------------- figures ----------------------------- */
const elderSeated = makeElderSeated();
elderSeated.position.set(0, 0, 1.12);
elderSeated.rotation.y = Math.PI;
scene.add(elderSeated);
S.elderSeated = elderSeated;

const elderBending = makeElderBending();
elderBending.position.set(1.9, 0, 1.25);
elderBending.rotation.y = Math.PI * 0.95;
scene.add(elderBending);
S.elderBending = elderBending;

const youth = makeYouth();
youth.position.set(-1.9, 0, -1.5);
youth.rotation.y = Math.PI * 0.72;
scene.add(youth);
S.youth = youth;

/* ----------------------------- acts (camera keyframes) ----------------------------- */
const acts = [
  { pos: [2.6, 1.9, 3.8], look: [0, 0.9, 0] }, // 0 hero
  { pos: [3.0, 1.5, 2.3], look: [1.6, 0.55, 0.6] }, // 1 pain (ground bed)
  { pos: [1.45, 1.15, 1.95], look: [0, 0.6, 0] }, // 2 lift cutaway
  { pos: [1.95, 1.45, 2.5], look: [0, 0.82, 0.25] }, // 3 reach
  { pos: [2.6, 0.95, 2.1], look: [0, 0.45, 0.05] }, // 4 stability
  { pos: [4.7, 2.9, 4.7], look: [-0.3, 1.1, -1.3] }, // 5 community
  { pos: [2.3, 1.7, 3.2], look: [0.1, 0.92, 0.25] }, // 6 finale
];
const N = acts.length;

/* ----------------------------- scroll + state ----------------------------- */
let scrollT = 0; // target (0..N-1)
let dispT = 0; // damped display
const camPos = new THREE.Vector3().fromArray(acts[0].pos);
const camLook = new THREE.Vector3().fromArray(acts[0].look);
const mouse = new THREE.Vector2(0, 0);

function computeScrollT() {
  const vh = window.innerHeight;
  return clamp(window.scrollY / vh, 0, N - 1);
}
window.addEventListener("scroll", () => { scrollT = computeScrollT(); }, { passive: true });
window.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
  mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
});

// rail nav
document.querySelector("[data-rail]").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  window.scrollTo({ top: parseInt(b.dataset.go, 10) * window.innerHeight, behavior: "smooth" });
});

const panels = [...document.querySelectorAll(".panel")];
const railBtns = [...document.querySelectorAll("[data-rail] button")];
const physCards = {
  lift: document.querySelector('[data-phys="lift"]'),
  reach: document.querySelector('[data-phys="reach"]'),
  stable: document.querySelector('[data-phys="stable"]'),
};
let lastActive = -1;

function updateDOM(t) {
  const active = Math.round(t);
  if (active === lastActive) return;
  lastActive = active;
  panels.forEach((p, i) => p.classList.toggle("on", i === active));
  railBtns.forEach((b, i) => b.classList.toggle("active", i === active));
  physCards.lift.classList.toggle("on", active === 2);
  physCards.reach.classList.toggle("on", active === 3);
  physCards.stable.classList.toggle("on", active === 4);
}

/* ----------------------------- per-frame state ----------------------------- */
function applyState(t, elapsed) {
  // table height: standing until end of act1, descend across act2, seated after
  const seated = smoothstep(1.6, 2.4, t);
  const liftY = (1 - seated) * (STAND_LIFT - SEAT_LIFT) + SEAT_LIFT;
  lift.position.y += (liftY - lift.position.y) * 0.12;

  // cutaway: reveal mechanism around act2
  const cut = bell(t, 2, 0.75);
  setOpacity(S.outerSleeve, 1 - cut * 0.82);
  setVisible(S.mech, cut > 0.02, cut);
  setVisible(S.forceArrow, cut > 0.05, cut);
  // nut tracks table height; screw spins while revealed
  S.nut.position.y = 0.3 + lift.position.y * 1.2 + 0.05;
  if (cut > 0.02) S.screwSpin.rotation.y = elapsed * 2.2;

  // reach envelope (act3)
  const rc = bell(t, 3, 0.7);
  setVisible(S.reach, rc > 0.02, rc);

  // stability (act4)
  const sc = bell(t, 4, 0.7);
  setVisible(S.stab, sc > 0.02, sc);

  // figures
  setVisible(S.elderBending, t < 1.7, clamp(bell(t, 1, 0.9) + (t < 1 ? 1 : 0), 0, 1));
  setVisible(S.groundBed, true, 1);
  setVisible(S.elderSeated, t > 1.6, smoothstep(1.7, 2.3, t));
  const youthWalk = smoothstep(4.4, 5.2, t);
  setVisible(S.youth, t > 4.3, smoothstep(4.3, 4.8, t));
  S.youth.position.set(-1.9 + youthWalk * 0.8, 0, -1.5 + youthWalk * 0.6);
  if (S.youth.userData.arm) S.youth.userData.arm.rotation.x = -0.3 - youthWalk * 0.9;

  // micro: plant sway, led pulse, elder tending, module rotate, water
  S.greens.children.forEach((c, i) => (c.rotation.z = Math.sin(elapsed * 1.5 + i) * 0.04));
  S.led.material.emissiveIntensity = 0.5 + Math.sin(elapsed * 3) * 0.3;
  if (S.elderSeated.userData.arm) {
    const tend = t > 2.6 && t < 3.6 ? 1 : 0;
    S.elderSeated.userData.arm.rotation.x = -0.8 - (tend ? Math.sin(elapsed * 3) * 0.25 + 0.3 : 0);
  }
  if (wall.userData.swap) {
    const sw = smoothstep(4.7, 5.6, t);
    wall.userData.swap.rotation.y = sw * Math.PI;
  }
  // finale: button pulse
  S.bigBtn.scale.setScalar(t > 5.5 ? 1 + Math.sin(elapsed * 4) * 0.12 : 1);
  // water during lift/reach acts
  const watering = t > 2.7 && t < 3.6;
  updateDrops(watering, elapsed);
}

/* ----------------------------- water drops ----------------------------- */
const dN = 50;
const dGeo = new THREE.BufferGeometry();
const dPos = new Float32Array(dN * 3);
for (let i = 0; i < dN; i++) seedDrop(i, true);
dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
const drops = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: C.water, size: 0.03, transparent: true, opacity: 0.85, depthWrite: false }));
drops.visible = false;
lift.add(drops);
function seedDrop(i, spread) {
  const a = Math.random() * Math.PI * 2;
  const r = 0.18 + Math.random() * 0.22;
  dPos[i * 3] = Math.cos(a) * r;
  dPos[i * 3 + 1] = (spread ? Math.random() : 1) * 0.3 + 0.08;
  dPos[i * 3 + 2] = Math.sin(a) * r + 0.0;
}
function updateDrops(on, elapsed) {
  drops.visible = on;
  if (!on) return;
  for (let i = 0; i < dN; i++) {
    dPos[i * 3 + 1] -= 0.012;
    if (dPos[i * 3 + 1] < 0.02) seedDrop(i, false);
  }
  dGeo.attributes.position.needsUpdate = true;
}

/* ----------------------------- loop ----------------------------- */
const clock = new THREE.Clock();
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;
  dispT += (scrollT - dispT) * Math.min(1, dt * 3.2);

  // camera from act keyframes
  const seg = clamp(Math.floor(dispT), 0, N - 2);
  const f = smoother(dispT - seg);
  const a0 = acts[seg], a1 = acts[seg + 1];
  const tp = lerpArr(a0.pos, a1.pos, f);
  const tl = lerpArr(a0.look, a1.look, f);
  camPos.lerp(new THREE.Vector3(tp[0], tp[1], tp[2]), Math.min(1, dt * 2.4));
  camLook.lerp(new THREE.Vector3(tl[0], tl[1], tl[2]), Math.min(1, dt * 2.4));
  camera.position.copy(camPos);
  camera.position.x += mouse.x * 0.12;
  camera.position.y += -mouse.y * 0.08;
  camera.lookAt(camLook);

  applyState(dispT, elapsed);
  updateDOM(dispT);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

document.querySelector("[data-loading]").style.display = "none";
scrollT = computeScrollT();
dispT = scrollT;

// capture param: ?act=i pins the story progress directly (robust for stills,
// independent of page scroll / fixed-canvas headless quirks)
(function initParams() {
  const q = new URLSearchParams(location.search);
  if (q.has("act")) {
    const i = clamp(parseInt(q.get("act"), 10) || 0, 0, N - 1);
    scrollT = i;
    dispT = i;
    // snap camera directly to this act so stills aren't captured mid-transition
    camPos.set(acts[i].pos[0], acts[i].pos[1], acts[i].pos[2]);
    camLook.set(acts[i].look[0], acts[i].look[1], acts[i].look[2]);
    try { window.scrollTo(0, i * window.innerHeight); } catch (e) {}
  }
})();

updateDOM(dispT);
tick();

/* =========================================================================
   builders & utils
   ========================================================================= */
function gradientTex(top, bottom) {
  const c = document.createElement("canvas");
  c.width = 16; c.height = 256;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, top); grad.addColorStop(1, bottom);
  g.fillStyle = grad; g.fillRect(0, 0, 16, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function woodTex() {
  const c = document.createElement("canvas"); c.width = 512; c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#ca9d6d"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) {
    g.fillStyle = `rgba(${150 + Math.random() * 30},${110 + Math.random() * 25},${70 + Math.random() * 20},0.22)`;
    g.fillRect(0, y, 512, 64);
    g.strokeStyle = "rgba(120,82,48,0.6)"; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke();
    g.strokeStyle = "rgba(120,82,48,0.13)"; g.lineWidth = 1;
    for (let k = 0; k < 6; k++) {
      const gy = y + 8 + Math.random() * 48;
      g.beginPath(); g.moveTo(0, gy);
      g.bezierCurveTo(170, gy + (Math.random() - 0.5) * 6, 340, gy + (Math.random() - 0.5) * 6, 512, gy);
      g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); return t;
}
function screenMat() {
  const c = document.createElement("canvas"); c.width = 200; c.height = 120;
  const g = c.getContext("2d");
  g.fillStyle = "#f4efe4"; g.fillRect(0, 0, 200, 120);
  g.fillStyle = "#2f6b4f"; g.fillRect(0, 0, 200, 34);
  g.fillStyle = "#fff"; g.font = "bold 18px sans-serif"; g.fillText("今日照料", 12, 24);
  g.fillStyle = "#e8744f"; roundRect(g, 12, 70, 176, 38, 10); g.fill();
  g.fillStyle = "#fff"; g.font = "bold 20px sans-serif"; g.fillText("去浇水 →", 42, 96);
  g.fillStyle = "#2f6b4f"; g.font = "16px sans-serif"; g.fillText("菠菜 · 今天", 14, 58);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.4, emissive: 0x333333, emissiveMap: t, emissiveIntensity: 0.4 });
}
function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function makeHorseshoePlanter(outer, inner, h, gapHalf) {
  const a0 = -Math.PI / 2 + gapHalf;
  const a1 = -Math.PI / 2 - gapHalf + Math.PI * 2;
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outer, a0, a1, false);
  shape.absarc(0, 0, inner, a1, a0, true);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 48 });
  geo.rotateX(-Math.PI / 2);
  const rim = new THREE.Mesh(geo, woodMat.clone());
  rim.castShadow = rim.receiveShadow = true;
  const sShape = new THREE.Shape();
  sShape.absarc(0, 0, outer - 0.05, a0, a1, false);
  sShape.absarc(0, 0, inner + 0.05, a1, a0, true);
  const sGeo = new THREE.ExtrudeGeometry(sShape, { depth: 0.05, bevelEnabled: false, curveSegments: 48 });
  sGeo.rotateX(-Math.PI / 2);
  const soil = new THREE.Mesh(sGeo, M(C.soil, { r: 1 }));
  soil.position.y = h - 0.02;
  const g = new THREE.Group();
  g.add(rim, soil);
  return g;
}
function scatterGreens(group, midR, gapHalf) {
  const n = 14;
  for (let i = 0; i < n; i++) {
    const ang = -Math.PI / 2 + gapHalf + (i / n) * (Math.PI * 2 - gapHalf * 2);
    const r = midR + (Math.random() - 0.5) * 0.08;
    const p = Math.random() > 0.5 ? cabbage() : lettuce();
    p.position.set(Math.cos(ang) * r, 0.17, Math.sin(ang) * r);
    group.add(p);
  }
}
function cabbage() {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), M(C.leafLight, { r: 0.85 }));
  core.scale.y = 0.8; core.castShadow = true; g.add(core);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), M(C.leaf, { r: 0.9 }));
    leaf.scale.set(1.1, 0.5, 1.1); leaf.position.set(Math.cos(a) * 0.05, -0.01, Math.sin(a) * 0.05); g.add(leaf);
  }
  return g;
}
function lettuce() {
  const g = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 6), M(i % 2 ? C.leaf : C.leafLight, { r: 0.9 }));
    leaf.position.set(Math.cos(a) * 0.03, 0.04, Math.sin(a) * 0.03);
    leaf.rotation.z = Math.cos(a) * 0.5; leaf.rotation.x = Math.sin(a) * 0.5; leaf.castShadow = true; g.add(leaf);
  }
  return g;
}
function makeRaisedBed() {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 0.7), M(C.woodDark, { r: 0.85 }));
  box.position.y = 0.2; box.castShadow = box.receiveShadow = true; g.add(box);
  const soil = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.6), M(C.soil, { r: 1 }));
  soil.position.y = 0.4; g.add(soil);
  for (let i = 0; i < 6; i++) { const p = Math.random() > 0.5 ? cabbage() : lettuce(); p.position.set(-0.6 + (i % 3) * 0.6, 0.46, i < 3 ? -0.15 : 0.15); p.scale.setScalar(1.2); g.add(p); }
  return g;
}
function makeGroundBed() {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.18, 0.9), M(C.woodDark, { r: 0.88 }));
  frame.position.y = 0.09; frame.castShadow = frame.receiveShadow = true; g.add(frame);
  const soil = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.8), M(C.soil, { r: 1 }));
  soil.position.y = 0.18; g.add(soil);
  for (let i = 0; i < 8; i++) { const p = Math.random() > 0.5 ? cabbage() : lettuce(); p.position.set(-0.5 + (i % 4) * 0.33, 0.22, i < 4 ? -0.18 : 0.18); g.add(p); }
  return g;
}
function buildWall() {
  const g = new THREE.Group();
  const W = 4.2, H = 2.3;
  [-W / 2, W / 2].forEach((x) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, H, 0.08), aluMat); p.position.set(x, H / 2, 0); p.castShadow = true; g.add(p); });
  for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(W, 0.06, 0.06), aluMat); r.position.set(0, 0.3 + i * ((H - 0.3) / 3), 0); g.add(r); }
  const cols = 6, rows = 3; let swap = null;
  for (let rr = 0; rr < rows; rr++) for (let cc = 0; cc < cols; cc++) {
    const x = -W / 2 + 0.5 + cc * ((W - 1) / (cols - 1));
    const y = 0.55 + rr * 0.62;
    const planted = (rr + cc) % 2 === 0;
    const mod = new THREE.Group();
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.14), M(planted ? C.leaf : C.cream, { r: 0.7 }));
    panel.rotation.z = Math.PI / 4; panel.castShadow = true; mod.add(panel);
    if (planted) for (let k = 0; k < 3; k++) { const pl = lettuce(); pl.scale.setScalar(0.8); pl.position.set((k - 1) * 0.12, 0.02, 0.1); mod.add(pl); }
    mod.position.set(x, y, 0.05); g.add(mod);
    if (rr === 1 && cc === 2) swap = mod;
  }
  g.userData.swap = swap;
  const drip = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, W, 8), M(C.tech, { r: 0.5, e: C.tech, ei: 0.2 }));
  drip.rotation.z = Math.PI / 2; drip.position.set(0, H - 0.05, 0.12); g.add(drip);
  return g;
}
function makeTree(x, z) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.6, 12), M(C.woodDark, { r: 0.95 }));
  trunk.position.y = 0.8; trunk.castShadow = true; g.add(trunk);
  [[0, 1.9, 0, 0.9], [0.4, 1.7, 0.3, 0.6], [-0.4, 1.75, -0.2, 0.55]].forEach(([dx, dy, dz, r]) => {
    const f = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), M(C.leaf, { r: 1 }));
    f.position.set(dx, dy, dz); f.castShadow = true; g.add(f);
  });
  g.position.set(x, 0, z); return g;
}
function makeBench(x, z) {
  const g = new THREE.Group();
  const seatB = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.4), woodMat.clone()); seatB.position.y = 0.45; seatB.castShadow = true; g.add(seatB);
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.07), woodMat.clone()); back.position.set(0, 0.65, -0.18); g.add(back);
  [-0.5, 0.5].forEach((sx) => { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.45, 0.35), aluDarkMat); leg.position.set(sx, 0.22, 0); g.add(leg); });
  g.position.set(x, 0, z); g.rotation.y = 0.5; return g;
}
function makeElderSeated() {
  const g = new THREE.Group();
  const cloth = M(C.elderCloth, { r: 0.9, t: true }).clone();
  const skin = M(C.skin, { r: 0.8, t: true }).clone();
  const pants = M(0x55606b, { r: 0.9, t: true }).clone();
  const hips = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), cloth); hips.position.y = 0.46; hips.scale.set(1, 0.8, 1); g.add(hips);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.28, 6, 12), cloth); torso.position.set(0, 0.68, -0.02); torso.rotation.x = 0.16; torso.castShadow = true; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 16), skin); head.position.set(0, 0.95, 0.02); head.castShadow = true; g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.125, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.6), M(C.elderHair, { r: 1, t: true }).clone()); hair.position.copy(head.position); g.add(hair);
  [-0.09, 0.09].forEach((sx) => {
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.26, 6, 10), pants); thigh.position.set(sx, 0.44, 0.2); thigh.rotation.x = Math.PI / 2; g.add(thigh);
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.26, 6, 10), pants); shin.position.set(sx, 0.22, 0.33); g.add(shin);
  });
  const arm = new THREE.Group(); arm.position.set(0.12, 0.78, 0.0);
  const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.22, 6, 10), cloth); upper.position.set(0.02, -0.12, 0.08); upper.rotation.x = 0.6; arm.add(upper);
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), skin); hand.position.set(0.04, -0.26, 0.2); arm.add(hand);
  arm.rotation.x = -0.8; g.add(arm); g.userData.arm = arm;
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
function makeElderBending() {
  const g = new THREE.Group();
  const cloth = M(C.elderCloth, { r: 0.9, t: true }).clone();
  const skin = M(C.skin, { r: 0.8, t: true }).clone();
  const pants = M(0x55606b, { r: 0.9, t: true }).clone();
  [-0.09, 0.09].forEach((sx) => { const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.5, 6, 10), pants); leg.position.set(sx, 0.4, 0); leg.rotation.x = 0.15; leg.castShadow = true; g.add(leg); });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.34, 6, 12), cloth); torso.position.set(0, 0.85, 0.22); torso.rotation.x = 1.05; torso.castShadow = true; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 16), skin); head.position.set(0, 0.92, 0.5); head.castShadow = true; g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.125, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.6), M(C.elderHair, { r: 1, t: true }).clone()); hair.position.copy(head.position); hair.rotation.x = 1.0; g.add(hair);
  [-0.12, 0.12].forEach((sx) => { const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.34, 6, 10), cloth); a.position.set(sx, 0.62, 0.42); a.rotation.x = 0.8; g.add(a); });
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
function makeYouth() {
  const g = new THREE.Group();
  const cloth = M(C.youthCloth, { r: 0.85, t: true }).clone();
  const skin = M(C.skin, { r: 0.8, t: true }).clone();
  const legMat = M(0x33414d, { r: 0.9, t: true }).clone();
  [-0.09, 0.09].forEach((sx) => { const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.6, 6, 10), legMat); leg.position.set(sx, 0.45, 0); leg.castShadow = true; g.add(leg); });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.4, 6, 12), cloth); torso.position.y = 1.05; torso.castShadow = true; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 16), skin); head.position.y = 1.42; head.castShadow = true; g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.135, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.65), M(C.youthHair, { r: 1, t: true }).clone()); hair.position.copy(head.position); g.add(hair);
  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.4, 6, 10), cloth); armL.position.set(-0.22, 1.05, 0); armL.rotation.z = 0.15; g.add(armL);
  const arm = new THREE.Group(); arm.position.set(0.22, 1.22, 0);
  const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.4, 6, 10), cloth); upper.position.y = -0.2; arm.add(upper); arm.rotation.x = -0.3; g.add(arm);
  g.userData.arm = arm;
  return g;
}

/* ---- fade / visibility helpers ---- */
function setOpacity(obj, o) {
  obj.traverse((n) => { if (n.isMesh && n.material) { n.material.transparent = true; n.material.opacity = o; } });
}
function setVisible(obj, vis, o = 1) {
  obj.visible = vis;
  if (!vis) return;
  obj.traverse((n) => {
    if (n.isMesh && n.material) { n.material.transparent = true; n.material.opacity = (n.material.userData.baseO ?? 1) * o; }
    if (n.isLine && n.material) { n.material.transparent = true; n.material.opacity = o; }
  });
}
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function smoothstep(a, b, x) { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function smoother(t) { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); }
function bell(t, c, w) { return clamp(1 - Math.abs(t - c) / w, 0, 1); }
function lerpArr(a, b, f) { return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
