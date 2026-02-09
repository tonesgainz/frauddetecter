"use client";

import { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { Transaction } from "@/data/transactions";
import { statusColor } from "@/lib/utils";

interface NodeData {
  pos: THREE.Vector3;
  basePos: THREE.Vector3; // rest position
  size: number;
  type: "ambient" | "transaction";
  tx?: Transaction;
  opacity: number;
  // Per-node drift params (unique speed/phase/radius)
  driftSpeed: number;
  driftPhase: number;
  driftRadius: number;
}

interface EdgeData {
  a: number;
  b: number;
  midBase: THREE.Vector3;
  midCurrent: THREE.Vector3;
  len: number;
}

interface Props {
  transactions: Transaction[];
  selectedTxId: string | null;
  onSelectTx: (tx: Transaction) => void;
}

const BG = 0xf9fafb;
const FAIL_COL = 0xdc2626;
const UNCERTAIN_COL = 0xd97706;
const RING_COL = 0x334155;

const AMBIENT_COUNT = 160;
const EDGE_MAX_DIST = 110;
const EDGE_KEEP = 0.35;

const ATTRACT_R = 180;
const ATTRACT_STR = 22;
const LERP = 0.065;
const SEGS = 8;

export default function NetworkGraph({ transactions, selectedTxId, onSelectTx }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(selectedTxId);
  selectedRef.current = selectedTxId;
  const txRef = useRef(transactions);
  txRef.current = transactions;
  const onSelectRef = useRef(onSelectTx);
  onSelectRef.current = onSelectTx;

  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    nodes: NodeData[];
    edges: EdgeData[];
    edgeAttr: THREE.BufferAttribute;
    edgeColorAttr: THREE.BufferAttribute;
    ringMesh: THREE.Mesh;
    labelCtx: CanvasRenderingContext2D;
    labelTex: THREE.CanvasTexture;
    labelSprite: THREE.Sprite;
    frame: number;
    mouse: { x: number; y: number; inside: boolean };
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let ro: ResizeObserver | null = null;

    function init(W: number, H: number) {
      if (cancelled || !container) return;
      const el = container;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(W, H);
      renderer.setClearColor(BG);
      el.appendChild(renderer.domElement);

      const camera = new THREE.OrthographicCamera(0, W, 0, H, -10, 10);
      camera.position.z = 1;
      const scene = new THREE.Scene();

      const cx = W / 2;
      const cy = H / 2;
      // Use BOTH dimensions so graph fills a wide rectangle properly
      const spreadX = W * 0.4;
      const spreadY = H * 0.4;
      const nodes: NodeData[] = [];

      // Ambient nodes — elliptical distribution matching container aspect ratio
      for (let i = 0; i < AMBIENT_COUNT; i++) {
        const ring = Math.random();
        const a = Math.random() * Math.PI * 2;
        const rx = 30 + ring * spreadX;
        const ry = 30 + ring * spreadY;
        const jitter = 15 + ring * 25;
        const x = cx + Math.cos(a) * rx + (Math.random() - 0.5) * jitter;
        const y = cy + Math.sin(a) * ry + (Math.random() - 0.5) * jitter;
        nodes.push({
          pos: new THREE.Vector3(x, y, 0),
          basePos: new THREE.Vector3(x, y, 0),
          size: 2.5 + Math.random() * 2.5,
          type: "ambient",
          opacity: 0.35 + Math.random() * 0.25,
          driftSpeed: 0.15 + Math.random() * 0.35,
          driftPhase: Math.random() * Math.PI * 2,
          driftRadius: 2 + Math.random() * 5,
        });
      }

      // Transaction nodes — elliptical ring in the mid-zone
      const txs = txRef.current;
      txs.forEach((tx, idx) => {
        const a = (idx / txs.length) * Math.PI * 2 - Math.PI / 2;
        const rFactor = 0.45 + (idx % 2 === 0 ? -0.08 : 0.08) + Math.sin(idx * 2.1) * 0.05;
        const x = cx + Math.cos(a) * spreadX * rFactor;
        const y = cy + Math.sin(a) * spreadY * rFactor;
        nodes.push({
          pos: new THREE.Vector3(x, y, 0),
          basePos: new THREE.Vector3(x, y, 0),
          size: tx.status === "FAIL" ? 10 : 8,
          type: "transaction",
          tx,
          opacity: 1,
          driftSpeed: 0.1 + Math.random() * 0.15,
          driftPhase: Math.random() * Math.PI * 2,
          driftRadius: 1.5 + Math.random() * 2,
        });
      });

      // Edges
      const edges: EdgeData[] = [];
      for (let i = 0; i < AMBIENT_COUNT; i++) {
        for (let j = i + 1; j < AMBIENT_COUNT; j++) {
          const d = nodes[i].pos.distanceTo(nodes[j].pos);
          if (d < EDGE_MAX_DIST && Math.random() < EDGE_KEEP) {
            const mid = nodes[i].pos.clone().add(nodes[j].pos).multiplyScalar(0.5);
            edges.push({ a: i, b: j, midBase: mid.clone(), midCurrent: mid.clone(), len: d });
          }
        }
      }

      // ── Ambient dots ──
      const dpr = Math.min(window.devicePixelRatio, 2);
      const pp = new Float32Array(AMBIENT_COUNT * 3);
      const ps = new Float32Array(AMBIENT_COUNT);
      const pa = new Float32Array(AMBIENT_COUNT);
      for (let i = 0; i < AMBIENT_COUNT; i++) {
        pp[i * 3] = nodes[i].pos.x;
        pp[i * 3 + 1] = nodes[i].pos.y;
        pp[i * 3 + 2] = 0;
        ps[i] = nodes[i].size * dpr;
        pa[i] = nodes[i].opacity;
      }
      const pg = new THREE.BufferGeometry();
      const ambientPosAttr = new THREE.BufferAttribute(pp, 3);
      pg.setAttribute("position", ambientPosAttr);
      pg.setAttribute("size", new THREE.BufferAttribute(ps, 1));
      pg.setAttribute("alpha", new THREE.BufferAttribute(pa, 1));
      scene.add(new THREE.Points(pg, new THREE.ShaderMaterial({
        vertexShader: `
          attribute float size;
          attribute float alpha;
          varying float vA;
          void main(){
            vA = alpha;
            gl_PointSize = size;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }`,
        fragmentShader: `
          varying float vA;
          void main(){
            float d = length(gl_PointCoord - vec2(0.5));
            if(d > 0.5) discard;
            float a = smoothstep(0.5, 0.1, d) * vA;
            gl_FragColor = vec4(0.6, 0.65, 0.72, a);
          }`,
        transparent: true,
        depthWrite: false,
      })));

      // ── Edges with per-vertex RGBA ──
      const vertPerEdge = SEGS * 2;
      const totalVerts = edges.length * vertPerEdge;
      const ep = new Float32Array(totalVerts * 3);
      const ec = new Float32Array(totalVerts * 4);
      const eg = new THREE.BufferGeometry();
      const edgeAttr = new THREE.BufferAttribute(ep, 3);
      const edgeColorAttr = new THREE.BufferAttribute(ec, 4);
      eg.setAttribute("position", edgeAttr);
      eg.setAttribute("color", edgeColorAttr);

      // Initial edge colors: slate-blue with distance-based alpha
      for (let e = 0; e < edges.length; e++) {
        const t = edges[e].len / EDGE_MAX_DIST;
        const alpha = 0.5 - t * 0.3; // short=0.5, long=0.2
        for (let v = 0; v < vertPerEdge; v++) {
          const ci = (e * vertPerEdge + v) * 4;
          ec[ci] = 0.55;     // R — slate blue
          ec[ci + 1] = 0.62; // G
          ec[ci + 2] = 0.72; // B
          ec[ci + 3] = alpha;
        }
      }

      scene.add(new THREE.LineSegments(eg, new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
      })));

      // ── Transaction nodes — store meshes for animation ──
      const txMeshGroups: Array<{ halo: THREE.Mesh; dot: THREE.Mesh; pip: THREE.Mesh }> = [];
      for (let i = AMBIENT_COUNT; i < nodes.length; i++) {
        const n = nodes[i];
        const isFail = n.tx?.status === "FAIL";
        const col = isFail ? FAIL_COL : UNCERTAIN_COL;

        const halo = new THREE.Mesh(
          new THREE.CircleGeometry(n.size * 3, 32),
          new THREE.ShaderMaterial({
            uniforms: { color: { value: new THREE.Color(col) } },
            vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
            fragmentShader: `uniform vec3 color; varying vec2 vUv; void main(){ float d=length(vUv-vec2(0.5))*2.0; gl_FragColor=vec4(color, smoothstep(1.0,0.2,d)*0.2); }`,
            transparent: true, depthWrite: false,
          })
        );
        halo.position.set(n.pos.x, n.pos.y, -0.5);
        scene.add(halo);

        const dot = new THREE.Mesh(
          new THREE.CircleGeometry(n.size, 32),
          new THREE.MeshBasicMaterial({ color: col })
        );
        dot.position.copy(n.pos);
        scene.add(dot);

        const pip = new THREE.Mesh(
          new THREE.CircleGeometry(n.size * 0.28, 16),
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 })
        );
        pip.position.set(n.pos.x, n.pos.y, 0.1);
        scene.add(pip);

        txMeshGroups.push({ halo, dot, pip });
      }

      // Selection ring
      const ringMesh = new THREE.Mesh(
        new THREE.RingGeometry(14, 16, 48),
        new THREE.MeshBasicMaterial({ color: RING_COL, transparent: true, opacity: 0.5 })
      );
      ringMesh.visible = false;
      scene.add(ringMesh);

      // Label
      const lc = document.createElement("canvas");
      lc.width = 256; lc.height = 48;
      const labelCtx = lc.getContext("2d")!;
      const labelTex = new THREE.CanvasTexture(lc);
      labelTex.minFilter = THREE.LinearFilter;
      const labelSprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: labelTex, transparent: true, depthWrite: false })
      );
      labelSprite.scale.set(110, 22, 1);
      labelSprite.visible = false;
      scene.add(labelSprite);

      const mouse = { x: -9999, y: -9999, inside: false };
      let time = 0;
      const state = {
        renderer, scene, camera, nodes, edges, edgeAttr, edgeColorAttr,
        ringMesh, labelCtx, labelTex, labelSprite, frame: 0, mouse,
      };
      threeRef.current = state;

      // ── Animate ──
      function animate() {
        if (cancelled) return;
        time += 0.016; // ~60fps

        // Drift all nodes slowly around their base position
        const ambientArr = ambientPosAttr.array as Float32Array;
        for (let i = 0; i < AMBIENT_COUNT; i++) {
          const n = nodes[i];
          const t = time * n.driftSpeed + n.driftPhase;
          n.pos.x = n.basePos.x + Math.sin(t) * n.driftRadius;
          n.pos.y = n.basePos.y + Math.cos(t * 0.7 + 1.3) * n.driftRadius;
          ambientArr[i * 3] = n.pos.x;
          ambientArr[i * 3 + 1] = n.pos.y;
        }
        ambientPosAttr.needsUpdate = true;

        // Drift transaction nodes + update their meshes + move DOM labels
        const labelContainer = labelsRef.current;
        for (let ti = 0; ti < txMeshGroups.length; ti++) {
          const ni = AMBIENT_COUNT + ti;
          const n = nodes[ni];
          const t = time * n.driftSpeed + n.driftPhase;
          n.pos.x = n.basePos.x + Math.sin(t) * n.driftRadius;
          n.pos.y = n.basePos.y + Math.cos(t * 0.7 + 1.3) * n.driftRadius;

          const grp = txMeshGroups[ti];
          grp.halo.position.set(n.pos.x, n.pos.y, -0.5);
          grp.dot.position.set(n.pos.x, n.pos.y, 0);
          grp.pip.position.set(n.pos.x, n.pos.y, 0.1);

          // Move DOM label directly (no React re-render)
          if (labelContainer) {
            const el = labelContainer.children[ti] as HTMLElement | undefined;
            if (el) {
              el.style.left = `${n.pos.x}px`;
              el.style.top = `${n.pos.y}px`;
            }
          }
        }

        const posArr = edgeAttr.array as Float32Array;
        const colArr = edgeColorAttr.array as Float32Array;

        for (let e = 0; e < edges.length; e++) {
          const edge = edges[e];
          const A = nodes[edge.a].pos;
          const B = nodes[edge.b].pos;
          let mx = edge.midBase.x;
          let my = edge.midBase.y;
          let bright = 0;

          if (mouse.inside) {
            const dx = mouse.x - edge.midBase.x;
            const dy = mouse.y - edge.midBase.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < ATTRACT_R && dist > 0.1) {
              const t = 1 - dist / ATTRACT_R;
              mx += (dx / dist) * ATTRACT_STR * t * t;
              my += (dy / dist) * ATTRACT_STR * t * t;
              bright = t;
            }
          }

          edge.midCurrent.x += (mx - edge.midCurrent.x) * LERP;
          edge.midCurrent.y += (my - edge.midCurrent.y) * LERP;

          const off = e * SEGS * 6;
          for (let s = 0; s < SEGS; s++) {
            const t1 = s / SEGS, t2 = (s + 1) / SEGS;
            const i1 = 1 - t1, i2 = 1 - t2;
            const vi = off + s * 6;
            posArr[vi] = i1*i1*A.x + 2*i1*t1*edge.midCurrent.x + t1*t1*B.x;
            posArr[vi+1] = i1*i1*A.y + 2*i1*t1*edge.midCurrent.y + t1*t1*B.y;
            posArr[vi+2] = 0;
            posArr[vi+3] = i2*i2*A.x + 2*i2*t2*edge.midCurrent.x + t2*t2*B.x;
            posArr[vi+4] = i2*i2*A.y + 2*i2*t2*edge.midCurrent.y + t2*t2*B.y;
            posArr[vi+5] = 0;
          }

          // Color: base slate-blue, brighter + more opaque near mouse
          const lenT = edge.len / EDGE_MAX_DIST;
          const baseAlpha = 0.5 - lenT * 0.3;
          const vpe = SEGS * 2;
          for (let v = 0; v < vpe; v++) {
            const ci = (e * vpe + v) * 4;
            // Shift toward deeper blue near mouse
            colArr[ci] = 0.55 - bright * 0.2;
            colArr[ci+1] = 0.62 - bright * 0.15;
            colArr[ci+2] = 0.72 + bright * 0.08;
            colArr[ci+3] = baseAlpha + bright * 0.5;
          }
        }
        edgeAttr.needsUpdate = true;
        edgeColorAttr.needsUpdate = true;

        // Selection ring + label (only update geometry when selection changes)
        const selId = selectedRef.current;
        if (selId) {
          const n = nodes.find((nd) => nd.tx?.id === selId);
          if (n) {
            ringMesh.visible = true;
            ringMesh.position.set(n.pos.x, n.pos.y, 0);
            // Only recreate geometry if selection changed
            if (ringMesh.userData.lastId !== selId) {
              ringMesh.geometry.dispose();
              ringMesh.geometry = new THREE.RingGeometry(n.size + 4, n.size + 6, 48);
              ringMesh.userData.lastId = selId;
              // Update label text only on selection change
              labelCtx.clearRect(0, 0, 256, 48);
              labelCtx.font = "600 20px Inter, sans-serif";
              labelCtx.fillStyle = "#1e293b";
              labelCtx.textAlign = "center";
              labelCtx.fillText(n.tx!.id, 128, 30);
              labelTex.needsUpdate = true;
            }
            labelSprite.visible = true;
            labelSprite.position.set(n.pos.x, n.pos.y - n.size - 20, 0);
          }
        } else {
          ringMesh.visible = false;
          labelSprite.visible = false;
          ringMesh.userData.lastId = null;
        }

        renderer.render(scene, camera);
        state.frame = requestAnimationFrame(animate);
      }
      state.frame = requestAnimationFrame(animate);

      const onResize = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h);
        camera.right = w;
        camera.bottom = h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);

      return () => {
        cancelled = true;
        cancelAnimationFrame(state.frame);
        window.removeEventListener("resize", onResize);
        // Dispose all geometries, materials, textures
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Points) {
            obj.geometry?.dispose();
            if (obj.material) {
              const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
              mats.forEach((m) => {
                if ('map' in m && m.map) (m.map as THREE.Texture).dispose();
                m.dispose();
              });
            }
          }
          if (obj instanceof THREE.Sprite) {
            obj.geometry?.dispose();
            if (obj.material) {
              if (obj.material.map) obj.material.map.dispose();
              obj.material.dispose();
            }
          }
        });
        scene.clear();
        renderer.dispose();
        if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
        threeRef.current = null;
      };
    }

    let cleanup: (() => void) | undefined;
    ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0 && !threeRef.current && !cancelled) {
        ro?.disconnect();
        cleanup = init(width, height);
      }
    });
    ro.observe(container);
    const w = container!.clientWidth;
    const h = container!.clientHeight;
    if (w > 0 && h > 0) { ro.disconnect(); cleanup = init(w, h); }

    return () => { cancelled = true; ro?.disconnect(); cleanup?.(); };
  }, [transactions]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const s = threeRef.current;
    if (!s) return;
    const r = e.currentTarget.getBoundingClientRect();
    s.mouse.x = e.clientX - r.left;
    s.mouse.y = e.clientY - r.top;
    s.mouse.inside = true;
  }, []);

  const onMouseLeave = useCallback(() => {
    const s = threeRef.current;
    if (s) { s.mouse.inside = false; s.mouse.x = -9999; s.mouse.y = -9999; }
  }, []);

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const s = threeRef.current;
      if (!s) return;
      const r = e.currentTarget.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      for (const n of s.nodes) {
        if (n.type !== "transaction" || !n.tx) continue;
        const dx = mx - n.pos.x;
        const dy = my - n.pos.y;
        if (Math.sqrt(dx * dx + dy * dy) < n.size + 12) {
          onSelectTx(n.tx);
          return;
        }
      }
    },
    [onSelectTx]
  );

  return (
    <div className="w-full h-full relative" style={{ background: "#F9FAFB" }} role="img" aria-label="Transaction network graph visualization">
      {/* Three.js canvas */}
      <div
        ref={containerRef}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        className="absolute inset-0 cursor-pointer"
        style={{ touchAction: "none" }}
      />
      {/* HTML labels — positioned via DOM ref, NOT React state */}
      <div ref={labelsRef} className="absolute inset-0 pointer-events-none">
        {transactions.map((tx) => {
          const isSelected = selectedTxId === tx.id;
          const isFail = tx.status === "FAIL";
          return (
            <div
              key={tx.id}
              className="absolute pointer-events-auto"
              style={{ left: 0, top: 0, transform: "translate(-50%, -50%)" }}
            >
              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onSelectTx(tx);
                }}
                className="flex items-center gap-1 group cursor-pointer"
              >
                <span
                  className="text-2xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm transition-transform group-hover:scale-110"
                  style={{
                    background: isSelected ? "#1e293b" : (isFail ? "#fecaca" : "#ffedd5"),
                    color: isSelected ? "#fff" : statusColor(tx.status),
                    border: isSelected ? "2px solid #334155" : `1px solid ${isFail ? "#fca5a5" : "#fed7aa"}`,
                  }}
                >
                  {isFail ? "FAIL" : "UNCERT"} {tx.id.slice(-4)}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
