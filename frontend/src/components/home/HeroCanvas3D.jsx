import React, { useEffect, useRef } from 'react';

/*
 * HeroCanvas3D — real WebGL 3D nebula (zero dependencies)
 * Spiral-galaxy particle field + halo shell, additive blending, depth-attenuated
 * point sprites, mouse parallax, scroll parallax & fade, twinkle.
 * Respects prefers-reduced-motion (renders one static frame).
 */

const VERT = `
attribute vec3 a_pos;
attribute vec3 a_col;
attribute vec3 a_meta;               /* x: size, y: twinkle phase, z: twinkle speed */
uniform float u_cy, u_sy, u_cx, u_sx; /* cos/sin of yaw & pitch */
uniform float u_dpr, u_time, u_aspect;
varying vec3 v_col;
varying float v_a;
void main() {
  vec3 p = a_pos;
  /* yaw around Y axis */
  float x = p.x * u_cy + p.z * u_sy;
  float z = -p.x * u_sy + p.z * u_cy;
  /* pitch around X axis */
  float y = p.y * u_cx - z * u_sx;
  z = p.y * u_sx + z * u_cx;
  float persp = 820.0 / max(140.0, 820.0 + z);
  gl_Position = vec4(x * persp * 0.00115 / u_aspect, y * persp * 0.00115, 0.0, 1.0);
  float tw = 0.6 + 0.4 * sin(u_time * a_meta.z + a_meta.y);
  v_a = clamp(persp, 0.35, 1.5) * tw;
  v_col = a_col;
  gl_PointSize = max(1.0, a_meta.x * u_dpr * persp);
}`;

const FRAG = `
precision mediump float;
varying vec3 v_col;
varying float v_a;
void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  float a = smoothstep(0.5, 0.05, d);
  a *= a;
  gl_FragColor = vec4(v_col, a * v_a * 0.92);
}`;

const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

/* پالت تطبیقی: کهکشان با متغیرهای CSS تم (--primary/--secondary/--accent) هماهنگ می‌شود */
const hexToRgb = (h) => {
  const v = parseInt(String(h).trim().replace('#', ''), 16);
  if (Number.isNaN(v)) return [0.545, 0.361, 0.965];
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
};
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const stableRand = (i) => {
  const s = Math.sin(i * 127.1) * 43758.5453;
  return s - Math.floor(s);
};
const readPalette = () => {
  const cs = getComputedStyle(document.documentElement);
  return {
    p: hexToRgb(cs.getPropertyValue('--primary') || '#8b5cf6'),
    s: hexToRgb(cs.getPropertyValue('--secondary') || '#6366f1'),
    a: hexToRgb(cs.getPropertyValue('--accent') || '#d946ef'),
  };
};
/* بازرنگ‌آمیزی ذرات بر اساس شعاع (هسته روشن → لبه تیره) — ذرات فیروزه‌ای امضای ثابت می‌مانند */
const paintColors = (col, pos, n, pal) => {
  const R = 470;
  const white = [1, 0.95, 0.99];
  const dark = [0.12, 0.1, 0.28];
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3], z = pos[i * 3 + 2];
    const r = Math.min(1, Math.sqrt(x * x + z * z) / R);
    const rv = stableRand(i);
    let c;
    if (rv < 0.055) c = [0.13 + rv * 1.8, 0.83, 0.93];                 /* cyan sparkle */
    else if (r < 0.22) c = mix3(white, pal.a, rv * 0.85);              /* warm core → accent */
    else if (r < 0.6) c = mix3(pal.p, mix3(pal.p, white, 0.42), rv);   /* primary mid */
    else c = mix3(pal.s, dark, 0.15 + rv * 0.3);                       /* deep rim */
    col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
  }
};

function buildParticles() {
  const N = 1400, R = 470;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const meta = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    let x, y, z, t;
    if (i % 4 === 0) {
      /* 25% halo shell for depth */
      const u = Math.random() * 2 - 1;
      const phi = Math.random() * Math.PI * 2;
      const sq = Math.sqrt(1 - u * u);
      const rad = R * (0.5 + Math.random() * 0.62);
      x = Math.cos(phi) * sq * rad;
      y = u * rad * 0.62;
      z = Math.sin(phi) * sq * rad;
      t = 0.85;
    } else {
      /* spiral galaxy disc — 3 arms */
      const arm = i % 3;
      t = Math.pow(Math.random(), 0.55);
      const r = 30 + t * R;
      const theta = arm * 2.0944 + t * 2.7 + gauss() * (0.42 - 0.22 * t);
      x = Math.cos(theta) * r;
      z = Math.sin(theta) * r;
      y = gauss() * 30 * (1 - t * 0.72);
    }
    const s = t < 0.22 ? 2.2 + Math.random() * 1.6
            : t < 0.6 ? 1.6 + Math.random() * 1.2
            : 1.1 + Math.random() * 1.1;
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    meta[i * 3] = s; meta[i * 3 + 1] = Math.random() * 6.2832; meta[i * 3 + 2] = 0.5 + Math.random() * 1.6;
  }
  paintColors(col, pos, N, readPalette());
  return { pos, col, meta, n: N };
}

export default function HeroCanvas3D() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', {
      alpha: true, premultipliedAlpha: false, antialias: false, depth: false,
      powerPreference: 'low-power',
    });
    if (!gl) { canvas.style.display = 'none'; return; }

    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.style.display = 'none'; return; }
    gl.useProgram(prog);

    const { pos, col, meta, n } = buildParticles();
    const buf = (data, loc, size) => {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      return b;
    };
    buf(pos, gl.getAttribLocation(prog, 'a_pos'), 3);
    const colBuf = buf(col, gl.getAttribLocation(prog, 'a_col'), 3);
    buf(meta, gl.getAttribLocation(prog, 'a_meta'), 3);

    const U = (name) => gl.getUniformLocation(prog, name);
    const u = { cy: U('u_cy'), sy: U('u_sy'), cx: U('u_cx'), sx: U('u_sx'), dpr: U('u_dpr'), time: U('u_time'), aspect: U('u_aspect') };

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      const r = canvas.parentElement.getBoundingClientRect();
      canvas.width = Math.max(2, Math.round(r.width * dpr));
      canvas.height = Math.max(2, Math.round(r.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0, 0, 0, 0);

    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let mx = 0, my = 0, tmx = 0, tmy = 0, raf = 0, running = !reduce, inView = true;
    const t0 = performance.now();

    const draw = (t) => {
      const yaw = t * 0.05 + mx * 0.45;
      const pitch = 0.45 + my * 0.22 + Math.sin(t * 0.1) * 0.05;
      gl.uniform1f(u.cy, Math.cos(yaw));
      gl.uniform1f(u.sy, Math.sin(yaw));
      gl.uniform1f(u.cx, Math.cos(pitch));
      gl.uniform1f(u.sx, Math.sin(pitch));
      gl.uniform1f(u.dpr, dpr);
      gl.uniform1f(u.time, t);
      gl.uniform1f(u.aspect, canvas.width / Math.max(1, canvas.height));
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, n);
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!running || !inView || document.hidden) return;
      mx += (tmx - mx) * 0.05;
      my += (tmy - my) * 0.05;
      draw((performance.now() - t0) / 1000);
    };

    const onMouse = (e) => {
      tmx = (e.clientX / window.innerWidth) * 2 - 1;
      tmy = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onScroll = () => {
      const y = window.scrollY || 0;
      canvas.style.transform = `translate3d(0, ${Math.min(y * 0.28, 520)}px, 0)`;
      canvas.style.opacity = Math.max(0, 1 - y / (window.innerHeight * 0.85));
    };
    const onVis = () => { /* handled via document.hidden check in loop */ };
    /* هماهنگی کهکشان با تغییر تم (کلاس body عوض می‌شود) */
    let mo = null;
    if (!reduce && 'MutationObserver' in window) {
      mo = new MutationObserver(() => {
        paintColors(col, pos, n, readPalette());
        gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, col);
      });
      mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
    let io = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver((es) => { inView = es[0].isIntersecting; }, { threshold: 0.02 });
      io.observe(canvas);
    }

    if (reduce) {
      draw(0); /* one static frame */
    } else {
      window.addEventListener('mousemove', onMouse, { passive: true });
      window.addEventListener('scroll', onScroll, { passive: true });
      document.addEventListener('visibilitychange', onVis);
      onScroll();
      raf = requestAnimationFrame(loop);
    }

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', resize);
      if (io) io.disconnect();
      if (mo) mo.disconnect();
      gl.getExtension('WEBGL_lose_context') && gl.getExtension('WEBGL_lose_context').loseContext();
    };
  }, []);

  return <canvas ref={ref} className="hero-canvas3d" aria-hidden="true" />;
}
