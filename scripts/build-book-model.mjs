// Builds public/models/book.glb: an open book whose pages keep flipping, for
// the ASCII book on the landing page. Run with: node scripts/build-book-model.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

// GLTFExporter reads blobs with FileReader, which Node does not provide.
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onload?.({ target: this });
      this.onloadend?.({ target: this });
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = `data:${blob.type || "application/octet-stream"};base64,${Buffer.from(buffer).toString("base64")}`;
      this.onload?.({ target: this });
      this.onloadend?.({ target: this });
    });
  }
};

const PAGE_W = 1;
const PAGE_H = 1.4;
const STACK = 0.12;
const COVER = 0.045;
const OPEN = THREE.MathUtils.degToRad(14);
const SEGMENTS = 4;
const FLIP_PAGES = 3;
const FLIP_SECONDS = 1.7;
const CLIP_SECONDS = 6.3;

const cover = new THREE.MeshStandardMaterial({ name: "cover", color: 0x0e4a52, roughness: 0.55 });
const paper = new THREE.MeshStandardMaterial({ name: "paper", color: 0xf1ede2, roughness: 0.9 });
const edge = new THREE.MeshStandardMaterial({ name: "edge", color: 0xd9d2bf, roughness: 0.95 });
const ink = new THREE.MeshStandardMaterial({ name: "ink", color: 0x3a3a38, roughness: 1 });
const ribbon = new THREE.MeshStandardMaterial({ name: "ribbon", color: 0xf2b33d, roughness: 0.6 });

function box(w, h, d, material, x, y, z, name) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.name = name;
  return mesh;
}

// Lines of "text" on a page face, from x0 to x0 + width.
function textLines(parent, x0, width, z, prefix, short = false) {
  const lines = short ? 9 : 11;
  for (let i = 0; i < lines; i += 1) {
    const ragged = i % 4 === 3 ? 0.55 : 1;
    const w = width * ragged;
    parent.add(box(w, 0.035, 0.004, ink, x0 + w / 2, PAGE_H / 2 - 0.2 - i * 0.1, z, `${prefix}-line-${i}`));
  }
}

const book = new THREE.Group();
book.name = "book";

// Each half: a page stack with its cover under it, tilted so the outer edges
// come toward the reader, like a book lying open.
for (const side of [1, -1]) {
  const half = new THREE.Group();
  half.name = side > 0 ? "right-half" : "left-half";
  half.rotation.y = -side * OPEN;
  const cx = (side * PAGE_W) / 2;
  half.add(box(PAGE_W, PAGE_H, STACK, paper, cx, 0, -STACK / 2, `${half.name}-stack`));
  half.add(box(0.012, PAGE_H, STACK, edge, side * (PAGE_W - 0.006), 0, -STACK / 2, `${half.name}-fore-edge`));
  half.add(
    box(PAGE_W + 0.06, PAGE_H + 0.09, COVER, cover, side * ((PAGE_W + 0.06) / 2), 0, -STACK - COVER / 2, `${half.name}-cover`),
  );
  textLines(half, side > 0 ? 0.14 : -0.14 - 0.72, 0.72, 0.003, half.name);
  book.add(half);
}

book.add(box(0.1, PAGE_H + 0.09, STACK * 2, cover, 0, 0, -STACK - COVER / 2, "spine"));
// A yellow ribbon marker hanging from the top of the gutter.
book.add(box(0.04, 0.5, 0.006, ribbon, 0.03, -PAGE_H / 2 - 0.12, 0.01, "ribbon"));

// Flipping pages: a chain of hinged segments so each page curls as it turns.
const tracks = [];
const restRight = -OPEN;
const restLeft = OPEN - Math.PI;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const yAxis = new THREE.Vector3(0, 1, 0);

for (let p = 0; p < FLIP_PAGES; p += 1) {
  const root = new THREE.Group();
  root.name = `page-${p}`;
  root.position.z = 0.008 + p * 0.004;
  book.add(root);

  let parent = root;
  const segmentW = PAGE_W / SEGMENTS;
  const segments = [];
  for (let s = 0; s < SEGMENTS; s += 1) {
    const hinge = new THREE.Group();
    hinge.name = `page-${p}-hinge-${s}`;
    hinge.position.x = s === 0 ? 0 : segmentW;
    hinge.add(box(segmentW, PAGE_H, 0.006, paper, segmentW / 2, 0, 0, `page-${p}-sheet-${s}`));
    const x0 = s === 0 ? 0.14 : 0;
    const w = s === 0 ? segmentW - 0.14 : s === SEGMENTS - 1 ? segmentW - 0.14 : segmentW;
    textLines(hinge, x0, w, 0.004, `page-${p}-seg-${s}`, true);
    parent.add(hinge);
    segments.push(hinge);
    parent = hinge;
  }

  const start = 0.35 + p * (CLIP_SECONDS / FLIP_PAGES);
  const times = [];
  const rootValues = [];
  const curlValues = segments.slice(1).map(() => []);
  const steps = 24;
  const push = (time, angle, curl) => {
    times.push(time);
    rootValues.push(...new THREE.Quaternion().setFromAxisAngle(yAxis, angle).toArray());
    curlValues.forEach((values, index) => {
      const amount = curl * (0.5 + index * 0.35);
      values.push(...new THREE.Quaternion().setFromAxisAngle(yAxis, amount).toArray());
    });
  };

  push(0, restRight, 0);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const angle = restRight + (restLeft - restRight) * ease(t);
    // The free edge trails behind the turn, most in the middle of the flip.
    const curl = 0.38 * Math.sin(Math.PI * t);
    push(start + t * FLIP_SECONDS, angle, curl);
  }
  push(CLIP_SECONDS, restLeft, 0);

  tracks.push(new THREE.QuaternionKeyframeTrack(`${root.name}.quaternion`, times, rootValues));
  segments.slice(1).forEach((segment, index) => {
    tracks.push(new THREE.QuaternionKeyframeTrack(`${segment.name}.quaternion`, times, curlValues[index]));
  });
}

// Present the book tilted back and turned a little, as if held up to read.
book.rotation.set(THREE.MathUtils.degToRad(-24), THREE.MathUtils.degToRad(-18), THREE.MathUtils.degToRad(4));

const scene = new THREE.Scene();
scene.add(book);
const clip = new THREE.AnimationClip("page-flip", CLIP_SECONDS, tracks);

const glb = await new GLTFExporter().parseAsync(scene, { binary: true, animations: [clip] });
mkdirSync("public/models", { recursive: true });
writeFileSync("public/models/book.glb", Buffer.from(glb));
console.log(`public/models/book.glb written (${Buffer.from(glb).length} bytes, ${tracks.length} tracks)`);
