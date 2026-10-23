(() => { // hi454
  "use strict";

  /*
   * LIBRARY LAUNCHER
   * Configure the entire Library from the CONFIG object near the top.
   * There is no on-page editor. Edit this source file and reload it.
   */

  // ======================== LIBRARY CONFIGURATION ========================
  // All routine customization lives here: content, appearance, background,
  // button labels, layout, launch behavior, and optional CSS overrides.
  const CONFIG = {
    title: "Lunara Launcher",
    subtitle: "",
    openingMenu: {
      eyebrow: "",
      heading: "",
      text: "",
      buttonText: "Browse"
    },
    labels: {
      brand: "Lunara Launcher",
      gamesHeading: "Games",
      launchButton: "Launch game",
      homeButton: "Home",
      closeButton: "Close",
      emptyMessage: "No games have been added yet.",
      countSingular: "game",
      countPlural: "games",
      redirectLoading: "Loading game HTML...",
      redirectError: "error loading"
    },
    layout: {
      maxWidth: "1100px",
      pagePadding: "30px 0 56px",
      cardMinWidth: "235px",
      cardGap: "14px",
      cardRadius: "19px",
      heroRadius: "26px",
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
      showHomeButton: true,
      showCloseButton: true,
      showGameCount: true
    },
    colors: {
      background: "#080b16",
      cardBackground: "#0c1023c9",
      text: "#f7f7ff",
      mutedText: "#aeb2c9",
      accent: "#9c8cff",
      border: "#ffffff1c",
      buttonText: "#071019"
    },
    background: {
      enabled: true,
      color: "#080b16",
      dotColor: "#9c8cff",
      accentColor: "#ff9ffc",
      gradientFrom: "#5227FF",
      gradientTo: "#FF9FFC",
      glowColor: "#ffffff",
      gradientAngle: 135,
      dotSpacing: 14,
      dotRadius: 1.5,
      cursorRadius: 240,
      bulgeStrength: 0.6,
      twist: 0,
      glowRadius: 160,
      glowIntensity: 0.8,
      baseOpacity: 0.55,
      waveAmplitude: 0,
      sparkle: false,
      speed: 1
    },
    // Optional CSS appended after the built-in stylesheet. Use it to change
    // any selector, animation, spacing, typography, borders, and responsive UI.
    customCSS: "",
    games: [
      {
        title: "Minecraft 26.3",
        description: "",
        url: "https://classroom-google-co-m.github.io/js/mc26.html",
        category: "games",
        mode: "redirect", // redirect | iframe | raw
        iframeTitle: "manecraft",
        iframeAllow: "fullscreen; autoplay; gamepad",
        iframeSandbox: "allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups",
        openInNewTab: true
      },
      {
        title: "Baldi's Basics +",
        description: "",
        url: "https://classroom-google-co-m.github.io/js/baldi-plus",
        category: "games",
        mode: "redirect",
        iframeTitle: "Another Game",
        iframeAllow: "fullscreen; autoplay; gamepad",
        iframeSandbox: "allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups",
        openInNewTab: true
      },
      {
        title: "Raw Example",
        description: "Opens the page directly in a new tab. This is the least isolated option.",
        url: "https://example.net",
        category: "Direct",
        mode: "raw",
        openInNewTab: true
      }
    ]
  };
  // ======================================================================

  const state = CONFIG;
  let root;
  let stopBackground;

  const log = (...args) => console.log("[Library]", ...args);
  const warn = (...args) => console.warn("[Library]", ...args);
  const error = (...args) => console.error("[Library]", ...args);

  if (window.__LIBRARY_RUNNING__) {
    warn("Library is already running.");
    return;
  }
  window.__LIBRARY_RUNNING__ = true;

  function addStyles() {
    if (document.getElementById("library-style")) return;
    const style = document.createElement("style");
    style.id = "library-style";
    style.textContent = `
      #library-root, #library-root * { box-sizing: border-box; }
      #library-root {
        --gd-bg: ${state.background.color};
        --gd-dot: ${state.background.dotColor};
        --gd-accent: ${state.background.accentColor};
        position: fixed; inset: 0; z-index: 2147483000; overflow: auto;
        color: ${state.colors.text}; font: 15px/1.5 ${state.layout.fontFamily};
        background: var(--gd-bg); isolation: isolate; color: ${state.colors.text};
      }
      #library-root button, #library-root input, #library-root textarea,
      #library-root select { font: inherit; }
      #gd-bg-canvas { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }
      .gd-shell { position: relative; z-index: 1; }
      .gd-shell { width: min(${state.layout.maxWidth}, calc(100% - 36px)); margin: 0 auto; padding: ${state.layout.pagePadding}; }
      .gd-top { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:42px; }
      .gd-brand { font-size:13px; font-weight:800; letter-spacing:.19em; color:var(--gd-accent); }
      .gd-actions { display:flex; flex-wrap:wrap; gap:9px; }
      .gd-btn { border:1px solid #ffffff28; border-radius:12px; padding:10px 15px; color:#fff;
        background:#ffffff0d; cursor:pointer; transition:transform .18s, background .18s, border-color .18s; }
      .gd-btn:hover { transform:translateY(-2px); background:#ffffff18; border-color:#ffffff55; }
      .gd-btn.primary { background:var(--gd-accent); border-color:transparent; color:${state.colors.buttonText}; font-weight:800; }
      .gd-hero { padding:clamp(22px,5vw,54px); border:1px solid ${state.colors.border}; border-radius:${state.layout.heroRadius};
        background:linear-gradient(135deg,#ffffff12,#ffffff05); box-shadow:0 25px 100px #0003; backdrop-filter:blur(12px); }
      .gd-kicker { color:var(--gd-accent); text-transform:uppercase; font-size:11px; letter-spacing:.2em; font-weight:800; }
      .gd-hero h1 { font-size:clamp(38px,8vw,76px); line-height:1.02; letter-spacing:-.055em; margin:12px 0; overflow-wrap:anywhere; }
      .gd-hero p { max-width:650px; color:#c6c8d9; margin:0 0 22px; }
      .gd-section-head { display:flex; align-items:end; justify-content:space-between; gap:14px; margin:34px 0 15px; }
      .gd-section-head h2 { margin:0; font-size:22px; letter-spacing:-.03em; }
      .gd-section-head span { color:#a7abc3; font-size:12px; }
      .gd-games { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,${state.layout.cardMinWidth}),1fr)); gap:${state.layout.cardGap}; }
      .gd-game { border:1px solid ${state.colors.border}; border-radius:${state.layout.cardRadius}; padding:19px; min-height:190px;
        background:${state.colors.cardBackground}; box-shadow:0 12px 35px #0002; backdrop-filter:blur(12px);
        display:flex; flex-direction:column; align-items:flex-start; }
      .gd-game h3 { margin:0 0 5px; font-size:18px; }
      .gd-game p { margin:0 0 16px; color:#aeb2c9; font-size:13px; flex:1; }
      .gd-tag { color:var(--gd-accent); font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.12em; margin-bottom:7px; }
      .gd-empty { color:#b9bdd2; padding:24px; border:1px dashed #ffffff35; border-radius:16px; }
      @media(max-width:560px) { .gd-top { align-items:flex-start; flex-direction:column; margin-bottom:25px; } .gd-form-grid { grid-template-columns:1fr; } .gd-field.full { grid-column:auto; } }
    `;
    style.textContent += "\n" + (state.customCSS || "");
    document.head.appendChild(style);
  }

  function safeUrl(value) {
    try {
      const url = new URL(value, location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    }[ch]));
  }

const VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec4 aDot;
uniform vec2 uSize;
uniform float uPixel;
uniform float uRadius;
uniform float uCell;
uniform vec4 uLens;
uniform vec2 uWarp;
uniform vec3 uGlow;
uniform vec3 uFrom;
uniform vec3 uTo;
uniform vec4 uGlowColor;
uniform vec3 uGradient;
uniform float uTime;
uniform float uWave;
uniform float uSparkle;
uniform float uFocus;
uniform float uBase;
uniform float uLight;
out vec2 vLocal;
out float vRadius;
out float vBlur;
out float vHalo;
out float vHaloWidth;
out vec3 vColor;
out float vAlpha;

vec3 toRgb(vec3 lab) {
  float l = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
  float m = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
  float s = lab.x - 0.0894841775 * lab.y - 1.291485548 * lab.z;
  vec3 lms = vec3(l * l * l, m * m * m, s * s * s);
  vec3 lin = clamp(vec3(
    4.0767416621 * lms.x - 3.3077115913 * lms.y + 0.2309699292 * lms.z,
    -1.2684380046 * lms.x + 2.6097574011 * lms.y - 0.3413193965 * lms.z,
    -0.0041960863 * lms.x - 0.7034186147 * lms.y + 1.707614701 * lms.z
  ), 0.0, 1.0);
  return mix(lin * 12.92, 1.055 * pow(lin, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, lin));
}

vec3 blend(vec3 a, vec3 b, float t) {
  vec2 ab = mix(a.yz, b.yz, t);
  float chroma = mix(length(a.yz), length(b.yz), t);
  float len = length(ab);
  return vec3(mix(a.x, b.x, t), len > 1e-5 ? ab * (chroma / len) : ab);
}

vec3 wave(vec2 p, float t) {
  float ay = p.x * 0.018 + t + 1.1 * sin(p.y * 0.016 - t * 0.4);
  float ax = p.y * 0.021 + t * 0.7 + 1.3 * sin(p.x * 0.013 + t * 0.3);
  float spread = cos(ay) * 0.0176 * cos(p.y * 0.016 - t * 0.4) + 0.5 * cos(ax) * 0.0169 * cos(p.x * 0.013 + t * 0.3);
  return uWave * vec3(0.5 * sin(ax), sin(ay), spread);
}

void main() {
  vec2 corner = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  vec2 center = uSize * 0.5;
  vec3 swell = wave(aDot.xy, uTime);
  vec2 source = center + (aDot.xy - center) * mix(1.12, 1.0, uFocus) + swell.xy;

  vec2 rel = source - uLens.xy;
  float x = length(rel) / uLens.z;
  float y = clamp(1.0 - x * x, 0.0, 1.0);
  float w = y * y * y;
  float k = uWarp.x * uLens.w;
  float grow = 1.0 + k * w;
  float spread = 1.0 + k * (w - 6.0 * x * x * y * y);
  float theta = uWarp.y * uLens.w * w;
  vec2 turn = vec2(cos(theta), sin(theta));
  vec2 display = uLens.xy + vec2(turn.x * rel.x - turn.y * rel.y, turn.y * rel.x + turn.x * rel.y) * grow;
  float scale = sqrt(max(grow * spread, 0.02));

  float spark = 0.0;
  if (uSparkle > 0.0) {
    float phase = 0.5 + 0.5 * sin(uTime * (0.55 + aDot.w * 0.9) + aDot.z * 6.2831853);
    spark = pow(phase, 48.0) * step(0.72, fract(aDot.z * 7.31 + aDot.w * 3.17)) * uSparkle;
  }

  float pool = 0.0;
  if (uGlow.x > 0.0) {
    float g = length(display - uLens.xy) / uGlow.x;
    float q = clamp(1.0 - g * g, 0.0, 1.0);
    pool = q * q * uGlow.y * uLens.w;
  }

  float radius = uRadius * (1.0 + 0.7 * spark);
  float device = radius * scale * uPixel;
  float fade = 1.0;
  if (device < 0.75) {
    fade = device * device / 0.5625;
    radius = 0.75 / (scale * uPixel);
  }
  float blur = (1.0 - uFocus) * uCell * 0.42;
  float energy = pow(radius / (radius + blur), 1.15);
  float halo = pool * uGlow.z;
  float haloWidth = 2.0 + radius * 1.5;
  float pad = radius + blur * 1.2 + 1.5 / (scale * uPixel) + (halo > 0.0 ? haloWidth * 2.5 : 0.0);

  float t = clamp(dot(aDot.xy - center, uGradient.xy) / uGradient.z + 0.5, 0.0, 1.0);
  vec3 tone = blend(uFrom, uTo, t);
  vec3 deep = vec3(tone.x * 0.72, tone.yz * 1.3);
  vec3 base = toRgb(tone);
  vec3 lit = toRgb(mix(deep, uGlowColor.xyz, uGlowColor.w));
  vec3 color = mix(base, lit, clamp(pool, 0.0, 1.0) * 0.8);
  color = mix(color, uLight > 0.5 ? color * 0.6 : vec3(1.0), spark * 0.55);

  vLocal = corner * pad;
  vRadius = radius + blur;
  vBlur = blur * 0.7;
  vHalo = halo;
  vHaloWidth = haloWidth;
  vColor = color;
  float shade = clamp(1.0 - swell.z * 2.5, 0.4, 1.6);
  vAlpha = mix(min(uBase * shade, 1.0), 1.0, clamp(max(pool, spark), 0.0, 1.0)) * fade * energy * smoothstep(0.0, 0.25, uFocus + 0.08);
  vec2 point = display + corner * pad * scale;
  gl_Position = vec4(point.x / uSize.x * 2.0 - 1.0, 1.0 - point.y / uSize.y * 2.0, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform float uOpacity;
in vec2 vLocal;
in float vRadius;
in float vBlur;
in float vHalo;
in float vHaloWidth;
in vec3 vColor;
in float vAlpha;
out vec4 fragColor;

void main() {
  float dist = length(vLocal);
  float d = dist - vRadius;
  float edge = max(fwidth(dist), 1e-4) + vBlur;
  float cover = 1.0 - smoothstep(-0.5 * edge, 0.5 * edge, d);
  float glow = vHalo * exp(-max(d, 0.0) / vHaloWidth) * 0.5;
  float alpha = min(cover + glow, 1.0) * vAlpha * uOpacity;
  if (alpha < 0.002) discard;
  fragColor = vec4(vColor * alpha, alpha);
}`;

// Dot layout modes used by buildDots. Keep these defined before the renderer starts.
const PATTERNS = Object.freeze({
  grid: "grid",
  hex: "hex",
  scatter: "scatter",
  spiral: "spiral"
});
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const parseColor = value => {
  const text = String(value || '').trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex) {
    const full = hex[1].length === 3 ? hex[1].replace(/./g, digit => digit + digit) : hex[1];
    return [0, 2, 4].map(index => parseInt(full.slice(index, index + 2), 16) / 255);
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
  if (rgb) return [rgb[1], rgb[2], rgb[3]].map(channel => clamp(parseFloat(channel) / 255, 0, 1));
  return null;
};

const toLinear = channel => (channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4));

const toOklab = color => {
  const [r, g, b] = color.map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ];
};

const toInk = (value, fallback, light) => {
  const lab = toOklab(parseColor(value) || fallback);
  if (!light) return lab;
  const hue = (Math.atan2(lab[2], lab[1]) * 180) / Math.PI;
  const warmth = clamp(1 - Math.abs(hue - 85) / 40, 0, 1);
  const ceiling = 0.6 + 0.16 * warmth * warmth * (3 - 2 * warmth);
  if (lab[0] <= ceiling) return lab;
  const boost = 1 + (lab[0] - ceiling) * 1.6;
  return [ceiling, lab[1] * boost, lab[2] * boost];
};

const chroma = value => {
  const lab = toOklab(parseColor(value) || [1, 1, 1]);
  return Math.hypot(lab[1], lab[2]);
};

const hash = (a, b, c) => {
  let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

const lensReach = (radius, strength, twist) => {
  let peak = 0;
  for (let index = 1; index < 48; index++) {
    const x = index / 48;
    const w = (1 - x * x) ** 3;
    const sigma = x * radius;
    const grow = 1 + strength * w;
    const theta = twist * w;
    peak = Math.max(peak, Math.hypot(sigma * (grow * Math.cos(theta) - 1), sigma * grow * Math.sin(theta)));
  }
  return peak;
};

const buildDots = (width, height, step, pattern, margin) => {
  const cx = width / 2;
  const cy = height / 2;
  const minX = -margin;
  const maxX = width + margin;
  const minY = -margin;
  const maxY = height + margin;
  const out = [];
  const push = (x, y, a, b) => {
    if (x >= minX && x <= maxX && y >= minY && y <= maxY) out.push(x, y, a, b);
  };
  if (pattern === PATTERNS.spiral) {
    const spacing = step / Math.sqrt(Math.PI);
    const reach = Math.hypot(width / 2 + margin, height / 2 + margin);
    const count = Math.ceil((reach / spacing) ** 2);
    for (let index = 0; index < count; index++) {
      const r = spacing * Math.sqrt(index + 0.5);
      const angle = index * GOLDEN_ANGLE;
      push(cx + r * Math.cos(angle), cy + r * Math.sin(angle), hash(index, 0, 3), hash(index, 0, 4));
    }
  } else {
    const rowStep = pattern === PATTERNS.hex ? (step * Math.sqrt(3)) / 2 : step;
    const cols = Math.ceil((width / 2 + margin) / step) + 1;
    const rows = Math.ceil((height / 2 + margin) / rowStep) + 1;
    for (let row = -rows; row <= rows; row++) {
      for (let col = -cols; col <= cols; col++) {
        let x = cx + col * step + (pattern === PATTERNS.hex && row & 1 ? step / 2 : 0);
        let y = cy + row * rowStep;
        if (pattern === PATTERNS.scatter) {
          x += (hash(col, row, 1) - 0.5) * step * 0.8;
          y += (hash(col, row, 2) - 0.5) * step * 0.8;
        }
        push(x, y, hash(col, row, 3), hash(col, row, 4));
      }
    }
  }
  return new Float32Array(out);
};

const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

const link = gl => {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = vertex && fragment ? gl.createProgram() : null;
  if (!vertex || !fragment || !program) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  const uniforms = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let index = 0; index < count; index++) {
    const info = gl.getActiveUniform(program, index);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
};

  function createBackground(canvas) {
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: "high-performance" });
    if (!gl) { warn("WebGL2 unavailable; using the solid CSS background."); return () => {}; }
    const shader = link(gl);
    if (!shader) { warn("DotField shaders could not initialize; using the solid CSS background."); return () => {}; }
    const vao = gl.createVertexArray(), buffer = gl.createBuffer();
    gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0); gl.vertexAttribDivisor(0, 1); gl.bindVertexArray(null);
    const size = { width: 1, height: 1, ratio: 1 };
    const pointer = { x: 0, y: 0, inside: false, down: false };
    const lens = { x: 0, y: 0, vx: 0, vy: 0, presence: 0, zoom: 0, ready: false };
    let raf = 0, last = 0, time = Math.random() * 100, count = 0, layoutKey = "", disposed = false;
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const settings = () => {
      const b = state.background;
      const radius = clamp(Number(b.dotRadius) || 1.5, .25, 12);
      const step = radius * 2 + clamp(Number(b.dotSpacing) || 14, 1, 200);
      const fromColor = parseColor(b.gradientFrom || b.dotColor || "#5227FF") || [0.32, .15, 1];
      const toColor = parseColor(b.gradientTo || b.accentColor || "#FF9FFC") || [1, .62, .99];
      const glow = parseColor(b.glowColor || "#ffffff") || [1,1,1];
      const angle = ((Number(b.gradientAngle) || 135) * Math.PI) / 180;
      return { radius, step, from: toInk(b.gradientFrom || b.dotColor || "#5227FF", [.32,.15,1], false), to: toInk(b.gradientTo || b.accentColor || "#FF9FFC",[1,.62,.99],false), glowColor: toInk(b.glowColor || "#ffffff",[1,1,1],false), glowWeight: 1,
        direction: [Math.sin(angle),-Math.cos(angle)], lensRadius: clamp(Number(b.cursorRadius)||240,20,2000), strength: clamp(Number(b.bulgeStrength ?? .6),-1,1), twist: (Number(b.twist)||0)*Math.PI/180,
        glowRadius: Math.max(0, Number(b.glowRadius)||160), glowIntensity: clamp(Number(b.glowIntensity ?? .8),0,2), base: clamp(Number(b.baseOpacity ?? .55),0,1), wave: clamp(Number(b.waveAmplitude)||0,0,60), sparkle: b.sparkle ? 1:0, speed: Math.max(0,Number(b.speed ?? 1)), opacity: 1, maxRatio: 2 };
    };
    const strengthOf = (s, zoom) => clamp((s.strength >= 0 ? s.strength * 1.2 : s.strength * .7) * (1 + zoom * .6), -.85, 1.45);
    const layout = () => {
      const s = settings();
      const reach = lensReach(s.lensRadius, strengthOf(s, 1), s.twist * 1.6);
      const margin = Math.ceil(reach + s.wave + s.step * 2);
      const area = (size.width + margin*2) * (size.height + margin*2);
      const step = Math.max(s.step, Math.sqrt(area / 120000));
      const key = `${size.width}|${size.height}|${step}|${margin}`;
      if (key === layoutKey) return; layoutKey = key;
      const data = buildDots(size.width, size.height, step, PATTERNS.grid, margin); count = data.length / 4;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    };
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(9000000 / Math.max(1, innerWidth * innerHeight)));
      canvas.width = Math.max(1, Math.round(innerWidth * ratio)); canvas.height = Math.max(1, Math.round(innerHeight * ratio));
      canvas.style.width = "100%"; canvas.style.height = "100%";
      size.width = innerWidth; size.height = innerHeight; size.ratio = canvas.width / Math.max(1, size.width); layoutKey = ""; layout(); wake();
    };
    const frame = now => {
      raf = 0; if (disposed) return;
      const s = settings(), dt = clamp((now-last)/1000 || 0, 0, .05); last = Math.max(last,now);
      if (!reduced) time += dt*s.speed;
      const tracking = pointer.inside;
      if (tracking && (!lens.ready || lens.presence < .01)) { lens.x=pointer.x; lens.y=pointer.y; lens.vx=lens.vy=0; lens.ready=true; }
      if (lens.ready) { const omega=18,f=1+2*dt*omega,oo=omega*omega,hoo=dt*oo,hhoo=dt*hoo,inv=1/(f+hhoo); const nx=(f*lens.x+dt*lens.vx+hhoo*pointer.x)*inv, ny=(f*lens.y+dt*lens.vy+hhoo*pointer.y)*inv; lens.vx=(lens.vx+hoo*(pointer.x-lens.x))*inv; lens.vy=(lens.vy+hoo*(pointer.y-lens.y))*inv; lens.x=nx; lens.y=ny; }
      const presenceTarget=tracking?1:0; lens.presence+=(presenceTarget-lens.presence)*(1-Math.exp(-dt/(tracking?.18:.4)));
      const zoomTarget=tracking&&pointer.down?1:0; lens.zoom+=(zoomTarget-lens.zoom)*(1-Math.exp(-dt/.14));
      const extent=Math.abs(size.width*s.direction[0])+Math.abs(size.height*s.direction[1]);
      gl.viewport(0,0,canvas.width,canvas.height); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA); gl.useProgram(shader.program); gl.bindVertexArray(vao);
      const u=shader.uniforms;
      gl.uniform2f(u.uSize,size.width,size.height); gl.uniform1f(u.uPixel,size.ratio); gl.uniform1f(u.uRadius,s.radius); gl.uniform1f(u.uCell,s.step);
      gl.uniform4f(u.uLens,lens.x,lens.y,s.lensRadius*(1+lens.zoom*.12),presenceTarget ? lens.presence*lens.presence*(3-2*lens.presence) : lens.presence*lens.presence*(3-2*lens.presence));
      gl.uniform2f(u.uWarp,strengthOf(s,lens.zoom),s.twist*(1+lens.zoom*.6)); gl.uniform3f(u.uGlow,s.glowRadius*(1+lens.zoom*.1),s.glowIntensity*(1+lens.zoom*.25),1);
      gl.uniform3f(u.uFrom,...s.from); gl.uniform3f(u.uTo,...s.to); gl.uniform4f(u.uGlowColor,...s.glowColor,s.glowWeight); gl.uniform3f(u.uGradient,s.direction[0],s.direction[1],Math.max(extent,1));
      gl.uniform1f(u.uTime,time); gl.uniform1f(u.uWave,s.wave); gl.uniform1f(u.uSparkle,s.sparkle); gl.uniform1f(u.uFocus,1); gl.uniform1f(u.uBase,s.base); gl.uniform1f(u.uLight,0); gl.uniform1f(u.uOpacity,s.opacity);
      if (count) gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,4,count);
      const moving=Math.abs(pointer.x-lens.x)+Math.abs(pointer.y-lens.y)>.05 || Math.hypot(lens.vx,lens.vy)>.5;
      const settling=Math.abs((tracking?1:0)-lens.presence)>.002 || Math.abs(zoomTarget-lens.zoom)>.002 || (lens.presence>.002&&moving);
      if (!reduced && s.speed>0 && (s.wave>0||s.sparkle>0) || settling) raf=requestAnimationFrame(frame);
    };
    function wake(){ if (!raf&&!disposed&&document.visibilityState!="hidden") { last=performance.now(); raf=requestAnimationFrame(frame); } }
    const locate = e => { const r=canvas.getBoundingClientRect(); pointer.x=e.clientX-r.left; pointer.y=e.clientY-r.top; pointer.inside=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom; };
    const move=e=>{locate(e);wake();}, down=e=>{locate(e);pointer.down=pointer.inside;wake();}, up=()=>{pointer.down=false;wake();}, leave=()=>{pointer.inside=false;pointer.down=false;wake();};
    addEventListener("resize",resize); addEventListener("pointermove",move,{passive:true}); addEventListener("pointerdown",down,{passive:true}); addEventListener("pointerup",up,{passive:true}); addEventListener("pointercancel",up,{passive:true}); document.documentElement.addEventListener("pointerleave",leave);
    resize(); log("DotField WebGL background initialized.");
    return () => { disposed=true; cancelAnimationFrame(raf); removeEventListener("resize",resize); removeEventListener("pointermove",move); removeEventListener("pointerdown",down); removeEventListener("pointerup",up); removeEventListener("pointercancel",up); document.documentElement.removeEventListener("pointerleave",leave); if(!gl.isContextLost()){gl.deleteBuffer(buffer);gl.deleteVertexArray(vao);gl.deleteProgram(shader.program);} };
  }

  function ensureRoot() {
    document.getElementById("library-root")?.remove();
    const root = document.createElement("div");
    root.id = "library-root";
    root.innerHTML = `<canvas id="gd-bg-canvas" aria-hidden="true"></canvas><div class="gd-shell">
      <header class="gd-top"><div class="gd-brand"></div><div class="gd-actions" id="gd-header-actions"></div></header>
      <section class="gd-hero"><div class="gd-kicker"></div><h1 id="gd-title"></h1>
        <p id="gd-subtitle"></p><div class="gd-actions"><button class="gd-btn primary" data-action="browse"></button></div>
      </section>
      <div class="gd-section-head"><h2 id="gd-games-heading"></h2><span id="gd-count"></span></div>
      <section id="gd-games" class="gd-games"></section>
    </div>`;
    document.body.appendChild(root);
    return root;
  }

  function render() {
    if (!root || !root.isConnected) return;
    root.style.setProperty("--gd-bg", state.colors.background || state.background.color);
    root.style.setProperty("--gd-dot", state.background.dotColor);
    root.style.setProperty("--gd-accent", state.colors.accent || state.background.accentColor);
    root.querySelector(".gd-brand").textContent = state.labels.brand;
    document.title = state.title;
    root.querySelector("#gd-title").textContent = state.openingMenu.heading || state.title;
    root.querySelector(".gd-kicker").textContent = state.openingMenu.eyebrow || "Your personal game library";
    root.querySelector("#gd-subtitle").textContent = [state.subtitle, state.openingMenu.text].filter(Boolean).join(" ");
    root.querySelector('[data-action="browse"]').textContent = state.openingMenu.buttonText || "Browse games";
    root.querySelector("#gd-games-heading").textContent = state.labels.gamesHeading;
    const count = root.querySelector("#gd-count");
    count.textContent = `${state.games.length} ${state.games.length === 1 ? state.labels.countSingular : state.labels.countPlural}`;
    count.hidden = !state.layout.showGameCount;
    const actions = root.querySelector("#gd-header-actions");
    actions.innerHTML = `${state.layout.showHomeButton ? `<button class="gd-btn" data-action="home">${esc(state.labels.homeButton)}</button>` : ""}${state.layout.showCloseButton ? `<button class="gd-btn" data-action="close">${esc(state.labels.closeButton)}</button>` : ""}`;
    const games = root.querySelector("#gd-games");
    if (!state.games.length) {
      games.innerHTML = `<div class="gd-empty">${esc(state.labels.emptyMessage)}</div>`;
    } else {
      games.innerHTML = state.games.map((game, i) => `
        <article class="gd-game">
          <div class="gd-tag">${esc(game.category || "Game")}</div>
          <h3>${esc(game.title || "Untitled game")}</h3>
          <p>${esc(game.description || "")}</p>
          <button class="gd-btn primary" data-launch="${i}">${esc(game.buttonText || state.labels.launchButton)}</button>
        </article>`).join("");
    }
    if (stopBackground) stopBackground();
    const canvas = root.querySelector("#gd-bg-canvas");
    canvas.hidden = !state.background.enabled;
    stopBackground = state.background.enabled ? createBackground(canvas) : null;
  }

  function openAboutBlank(title) {
    const tab = window.open("about:blank", "_blank");
    if (!tab) {
      alert("The new tab was blocked. Allow pop-ups for this site and try again.");
      return null;
    }
    try {
      tab.document.title = title || "Game";
      tab.document.body.style.margin = "0";
      tab.document.body.style.background = "#000";
    } catch (err) { warn("Could not initialize the new tab:", err); }
    return tab;
  }

  async function launchGame(game) {
    const url = safeUrl(game && game.url);
    if (!url) { warn("This game has an invalid URL:", game && game.url); return; }
    const mode = ["redirect", "iframe", "raw"].includes(game.mode) ? game.mode : "redirect";
    log(`Launching ${game.title || "game"} using mode: ${mode}`, url);

    if (mode === "raw") {
      const tab = window.open(url, game.openInNewTab === false ? "_self" : "_blank");
      if (!tab) warn("The browser may have blocked the new tab.");
      return;
    }

    // Open synchronously from the click handler so popup blockers allow it.
    const tab = openAboutBlank(game.title || "Game");
    if (!tab) return;

    if (mode === "iframe") {
      const iframe = tab.document.createElement("iframe");
      iframe.title = game.iframeTitle || game.title || "Game";
      iframe.src = url;
      iframe.allow = game.iframeAllow || "fullscreen; autoplay; gamepad";
      iframe.referrerPolicy = game.referrerPolicy || "strict-origin-when-cross-origin";
      iframe.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0;background:#000";
      if (game.iframeSandbox) iframe.setAttribute("sandbox", game.iframeSandbox);
      tab.document.body.appendChild(iframe);
      return;
    }

    // redirect mode downloads the HTML response and writes it into the blank tab.
    // The target server must permit fetch via CORS for this to work cross-origin.
    const status = tab.document.createElement("p");
    status.textContent = state.labels.redirectLoading;
    status.style.cssText = "color:#ddd;font:16px system-ui;padding:24px";
    tab.document.body.appendChild(status);
    try {
      const response = await fetch(url, { cache: game.cacheMode || "default", credentials: game.credentials || "omit" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get("content-type") || "";
      if (contentType && !/text\/html|application\/xhtml\+xml/i.test(contentType)) {
        warn("The redirect target did not advertise an HTML content type:", contentType);
      }
      let html = await response.text();
      // Preserve relative script, stylesheet, image, and asset paths after the
      // response is written into about:blank.
      const baseTag = `<base href="${esc(url)}">`;
      if (/<head\b[^>]*>/i.test(html)) {
        html = html.replace(/<head\b[^>]*>/i, match => `${match}${baseTag}`);
      } else if (/<html\b[^>]*>/i.test(html)) {
        html = html.replace(/<html\b[^>]*>/i, match => `${match}<head>${baseTag}</head>`);
      } else {
        html = `<!doctype html><html><head>${baseTag}</head><body>${html}</body></html>`;
      }
      tab.document.open();
      tab.document.write(html);
      tab.document.close();
    } catch (err) {
      error("Could not download game HTML for redirect mode:", err);
      try {
        tab.document.open();
        tab.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(game.title || "Game")}</title></head><body style="margin:0;background:#080b16;color:#f7f7ff;font:16px system-ui;padding:24px"><h1>Could not load game HTML</h1><p>${esc(state.labels.redirectError)}</p><p>${esc(String(err && err.message || err))}</p><p>Try iframe mode or raw mode for this URL.</p></body></html>`);
        tab.document.close();
      } catch (_) { /* tab may have been closed */ }
    }
  }

  function mount() {
    addStyles();
    root = ensureRoot();
    render();
    root.addEventListener("click", event => {
      const action = event.target.closest("[data-action]");
      if (action) {
        const name = action.dataset.action;
        if (name === "close") {
          if (stopBackground) stopBackground();
          root.remove();
          document.getElementById("library-style")?.remove();
          window.__LIBRARY_RUNNING__ = false;
          log("Library closed.");
        }
        if (name === "home") window.scrollTo({ top: 0, behavior: "smooth" });
        if (name === "browse") root.querySelector("#gd-games")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      const launch = event.target.closest("[data-launch]");
      if (launch) {
        const game = state.games[Number(launch.dataset.launch)];
        if (game) void launchGame(game);
      }
    });
    log("Library loaded successfully.");
    log("No on-page editor is included. Edit CONFIG near the top of this script to customize the entire Library.");
  }

  const libraryAddon = {
    run() {
      if (window.__LIBRARY_RUNNING__) return root || document.getElementById("library-root");
      window.__LIBRARY_RUNNING__ = true;
      try {
        if (!document.body) throw new Error("document.body is not available yet. Run this add-on after the page loads.");
        mount();
        return root;
      } catch (err) {
        error("Library failed to load:", err);
        window.__LIBRARY_RUNNING__ = false;
        return null;
      }
    }
  };
  window.LibraryAddon = libraryAddon;
  if (!window.addon) window.addon = libraryAddon;

  try {
    if (!document.body) throw new Error("document.body is not available yet. Run this script after the page loads.");
    mount();
  } catch (err) {
    error("Library failed to load:", err);
    window.__LIBRARY_RUNNING__ = false;
  }
})();
