import * as THREE from "../../public/vendor/three.module.min.js";
import { ProceduralCharacterView } from "./character-view.js";

const STAGE_CENTER = 640;
const WORLD_SCALE = 78;
const GROUND_Y = 430;

const CAMERA_POSES = {
  title: { position: [0, 4.8, 10.8], target: [0, 1.4, 0] },
  lobby: { position: [4.8, 3.6, 7.8], target: [-2.5, 1.35, 0] },
  select: { position: [0, 3.4, 9.2], target: [0, 1.3, 0] },
  detail: { position: [4.4, 3.2, 7.2], target: [-2.7, 1.35, 0] },
  matching: { position: [0, 3.8, 8.8], target: [0, 1.3, 0] },
  battle: { position: [0, 4.1, 11.7], target: [0, 1.25, 0] },
  result: { position: [0, 3.7, 8.6], target: [0, 1.25, 0] }
};

export class ChampionScene {
  constructor(canvas, onFailure) {
    this.canvas = canvas;
    this.onFailure = onFailure;
    this.clock = new THREE.Clock();
    this.elapsed = 0;
    this.mode = "title";
    this.selectedCharacterId = "silver_knight";
    this.snapshot = null;
    this.showcaseViews = new Map();
    this.battleViews = new Map();
    this.itemViews = new Map();
    this.targetCamera = new THREE.Vector3();
    this.targetLook = new THREE.Vector3();
    this.currentLook = new THREE.Vector3();
    this.visible = true;
    this.animationFrame = 0;
    this.init();
  }

  init() {
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    } catch (error) {
      this.onFailure?.(error);
      return;
    }
    this.renderer.setClearColor(0x111923);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x131d28);
    this.scene.fog = new THREE.Fog(0x172331, 12, 35);
    this.camera = new THREE.PerspectiveCamera(38, 1, .1, 80);
    this.buildLighting();
    this.buildArena();
    this.buildCharacters();
    this.setMode("title", "silver_knight");
    this.resize();

    window.addEventListener("resize", () => this.resize());
    document.addEventListener("visibilitychange", () => {
      this.visible = !document.hidden;
      if (this.visible) {
        this.clock.getDelta();
        this.animate();
      } else {
        cancelAnimationFrame(this.animationFrame);
      }
    });
    this.canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      this.onFailure?.(new Error("WebGL context lost"));
    });
    this.animate();
  }

  buildLighting() {
    this.scene.add(new THREE.HemisphereLight(0x9eb6c9, 0x182029, 1.55));
    const sun = new THREE.DirectionalLight(0xe8f1f6, 3.4);
    sun.position.set(-7, 12, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -13;
    sun.shadow.camera.right = 13;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -4;
    sun.shadow.bias = -.0004;
    this.scene.add(sun);
    const blueRim = new THREE.PointLight(0x247fc6, 18, 12, 2);
    blueRim.position.set(-6, 2.2, 2);
    const redRim = new THREE.PointLight(0xb63b38, 15, 12, 2);
    redRim.position.set(6, 2.2, 2);
    this.scene.add(blueRim, redRim);
  }

  buildArena() {
    this.arena = new THREE.Group();
    this.scene.add(this.arena);
    const stone = std(0x4c5660, .94);
    const stoneDark = std(0x303944, .98);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 16, 15, 8), stone);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.arena.add(floor);

    for (let x = -14; x < 14; x += 2) {
      for (let z = -5; z < 5; z += 2) {
        const tile = new THREE.Mesh(new THREE.PlaneGeometry(1.92, 1.92), (Math.abs(x + z) % 4 === 0) ? stoneDark : stone);
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(x + ((z / 2) % 2) * .25, .012, z);
        tile.receiveShadow = true;
        this.arena.add(tile);
      }
    }

    const wall = new THREE.Group();
    wall.position.z = -5.3;
    for (let x = -14; x <= 14; x += 1.35) {
      const block = box(1.28, 2.5 + (Math.abs(x) > 10 ? .7 : 0), 1.2, stoneDark);
      block.position.set(x, block.geometry.parameters.height / 2, 0);
      wall.add(block);
      if (Math.round(x * 10) % 27 === 0) {
        const merlon = box(.78, .75, 1.28, stoneDark);
        merlon.position.set(x, 3, 0);
        wall.add(merlon);
      }
    }
    for (const x of [-10.5, 10.5]) {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.2, 5.4, 8), stoneDark);
      tower.position.set(x, 2.7, -.25);
      tower.castShadow = tower.receiveShadow = true;
      wall.add(tower);
      for (let i = 0; i < 8; i += 2) {
        const merlon = box(.75, .72, .9, stoneDark);
        const angle = i / 8 * Math.PI * 2;
        merlon.position.set(x + Math.sin(angle) * 1.75, 5.72, -.25 + Math.cos(angle) * 1.75);
        merlon.rotation.y = angle;
        wall.add(merlon);
      }
    }
    this.arena.add(wall);
    this.addGate(stoneDark);
    this.addFlags();
    this.addMountains();
  }

  addGate(stoneMaterial) {
    const gate = new THREE.Group();
    gate.position.set(0, 0, -4.62);
    const left = box(2.5, 4.4, 1, stoneMaterial);
    left.position.set(-2.1, 2.2, 0);
    const right = left.clone();
    right.position.x = 2.1;
    const top = box(2, 1.25, 1, stoneMaterial);
    top.position.set(0, 3.8, 0);
    const door = box(2.2, 3.4, .28, std(0x17202a, .9));
    door.position.set(0, 1.7, .53);
    gate.add(left, right, top, door);
    this.arena.add(gate);
  }

  addFlags() {
    for (const [x, color] of [[-7, 0x1768b1], [7, 0xa82e2b]]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.035, .045, 4.8, 8), std(0x5f6870, .55, .65));
      pole.position.set(x, 4.2, -4.35);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.7), new THREE.MeshStandardMaterial({ color, roughness: .82, side: THREE.DoubleSide }));
      flag.position.set(x + .62, 5.45, -4.34);
      flag.rotation.y = Math.PI;
      this.arena.add(pole, flag);
    }
  }

  addMountains() {
    const mountainMaterial = std(0x263644, 1);
    for (let i = 0; i < 13; i++) {
      const mountain = new THREE.Mesh(new THREE.ConeGeometry(2.4 + (i % 3), 5 + (i % 4), 5), mountainMaterial);
      mountain.position.set(-18 + i * 3.1, 2, -14 - (i % 3));
      mountain.rotation.y = i * .7;
      this.arena.add(mountain);
    }
  }

  buildCharacters() {
    for (const id of ["silver_knight", "saladin"]) {
      const view = new ProceduralCharacterView(id);
      this.scene.add(view.root);
      this.showcaseViews.set(id, view);
    }
  }

  setMode(mode, selectedCharacterId = this.selectedCharacterId) {
    this.mode = mode;
    this.selectedCharacterId = selectedCharacterId;
    const pose = CAMERA_POSES[mode] || CAMERA_POSES.title;
    this.targetCamera.fromArray(pose.position);
    this.targetLook.fromArray(pose.target);
    if (!this.camera.position.length()) this.camera.position.copy(this.targetCamera);
    this.layoutShowcase();
  }

  layoutShowcase() {
    const isBattle = this.mode === "battle";
    for (const view of this.battleViews.values()) view.root.visible = isBattle;
    for (const view of this.showcaseViews.values()) view.root.visible = !isBattle;
    if (isBattle) return;
    const silver = this.showcaseViews.get("silver_knight");
    const saladin = this.showcaseViews.get("saladin");
    silver.root.visible = true;
    saladin.root.visible = true;
    silver.root.scale.setScalar(1.18);
    saladin.root.scale.setScalar(1.18);
    silver.setEquipment(fullEquipment());
    saladin.setEquipment(fullEquipment());

    if (this.mode === "title") {
      silver.root.position.set(-2.7, 0, .2);
      saladin.root.position.set(2.7, 0, .2);
      silver.root.rotation.y = Math.PI / 2;
      saladin.root.rotation.y = -Math.PI / 2;
    } else if (this.mode === "select") {
      silver.root.position.set(-2.45, 0, .2);
      saladin.root.position.set(2.45, 0, .2);
      silver.root.rotation.y = .25;
      saladin.root.rotation.y = -.25;
    } else {
      const selected = this.showcaseViews.get(this.selectedCharacterId);
      const other = this.showcaseViews.get(this.selectedCharacterId === "silver_knight" ? "saladin" : "silver_knight");
      selected.root.visible = true;
      other.root.visible = false;
      selected.root.position.set(this.mode === "detail" || this.mode === "lobby" ? -2.8 : 0, 0, .25);
      selected.root.rotation.y = .28;
      selected.root.scale.setScalar(this.mode === "detail" ? 1.38 : 1.24);
    }
  }

  setSnapshot(snapshot, localSide) {
    this.snapshot = snapshot;
    if (!snapshot || this.mode !== "battle") return;
    for (const player of snapshot.players) {
      let view = this.battleViews.get(player.side);
      if (!view || view.characterId !== player.characterId) {
        view?.dispose();
        view = new ProceduralCharacterView(player.characterId);
        this.scene.add(view.root);
        this.battleViews.set(player.side, view);
      }
      view.root.visible = true;
      view.root.scale.setScalar(1);
      view.root.position.x = worldX(player.position.x);
      view.root.position.z = player.side === "p1" ? .15 : -.15;
      view.setEquipment(player.equipment);
      view.setAppearance({ side: player.side, highlighted: player.side === localSide });
    }
    for (const [side, view] of this.battleViews) {
      if (!snapshot.players.some((player) => player.side === side)) view.root.visible = false;
    }
    this.syncFieldItems(snapshot.fieldItems || []);
  }

  syncFieldItems(items) {
    const active = new Set();
    for (const field of items) {
      active.add(field.id);
      let view = this.itemViews.get(field.id);
      if (!view) {
        view = makeFieldItem(field.item.slot, field.item.originCharacterId);
        this.scene.add(view);
        this.itemViews.set(field.id, view);
      }
      view.position.set(worldX(field.position.x), .24, .55);
    }
    for (const [id, view] of this.itemViews) {
      if (active.has(id)) continue;
      view.removeFromParent();
      disposeGroup(view);
      this.itemViews.delete(id);
    }
  }

  resize() {
    if (!this.renderer) return;
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    const lowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.75));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  }

  animate() {
    if (!this.renderer || !this.visible) return;
    this.animationFrame = requestAnimationFrame(() => this.animate());
    const delta = Math.min(this.clock.getDelta(), .05);
    this.elapsed += delta;
    this.camera.position.lerp(this.targetCamera, 1 - Math.pow(.001, delta));
    this.currentLook.lerp(this.targetLook, 1 - Math.pow(.001, delta));
    this.camera.lookAt(this.currentLook);

    if (this.mode === "battle" && this.snapshot) {
      for (const player of this.snapshot.players) {
        const view = this.battleViews.get(player.side);
        if (!view) continue;
        view.root.position.x = THREE.MathUtils.lerp(view.root.position.x, worldX(player.position.x), Math.min(1, delta * 18));
        view.update({ ...player, worldY: Math.max(0, (GROUND_Y - player.position.y) / WORLD_SCALE) }, delta, this.elapsed);
      }
      for (const item of this.itemViews.values()) {
        item.rotation.y += delta * 1.5;
        item.position.y = .24 + Math.sin(this.elapsed * 3 + item.id) * .04;
      }
    } else {
      for (const view of this.showcaseViews.values()) {
        if (view.root.visible) view.update({ state: "Idle", facing: view.characterId === "silver_knight" ? 1 : -1, worldY: 0 }, delta, this.elapsed);
      }
    }
    this.renderer.render(this.scene, this.camera);
  }
}

function fullEquipment() {
  return { cloak: {}, head: {}, armor: {}, weapon: {} };
}

function worldX(x) {
  return (x - STAGE_CENTER) / WORLD_SCALE;
}

function std(color, roughness = .8, metalness = .08) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function box(width, height, depth, material) {
  const result = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  result.castShadow = true;
  result.receiveShadow = true;
  return result;
}

function makeFieldItem(slot, characterId) {
  const color = characterId === "silver_knight" ? 0x2783cb : 0xc3433d;
  const group = new THREE.Group();
  group.userData.phase = Math.random() * Math.PI * 2;
  const material = std(color, .55, .34);
  let item;
  if (slot === "weapon" && characterId === "saladin") {
    for (const side of [-1, 1]) {
      item = new THREE.Mesh(new THREE.BoxGeometry(.08, .72, .07), material);
      item.position.x = side * .12;
      item.rotation.z = side * .28;
      item.castShadow = true;
      group.add(item);
    }
  } else {
    if (slot === "weapon") item = new THREE.Mesh(new THREE.BoxGeometry(.13, 1, .1), material);
    else if (slot === "head" && characterId === "saladin") item = new THREE.Mesh(new THREE.SphereGeometry(.29, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), material);
    else if (slot === "head") item = new THREE.Mesh(new THREE.CylinderGeometry(.24, .3, .36, 6), material);
    else if (slot === "armor" && characterId === "saladin") item = new THREE.Mesh(new THREE.CylinderGeometry(.25, .34, .5, 8), material);
    else if (slot === "armor") item = new THREE.Mesh(new THREE.BoxGeometry(.62, .54, .28), material);
    else if (characterId === "saladin") item = new THREE.Mesh(new THREE.ConeGeometry(.34, .82, 4, 1, true), material);
    else item = new THREE.Mesh(new THREE.BoxGeometry(.62, .7, .05), material);
    item.castShadow = true;
    group.add(item);
  }
  return group;
}

function disposeGroup(group) {
  group.traverse((object) => {
    object.geometry?.dispose();
    object.material?.dispose?.();
  });
}
