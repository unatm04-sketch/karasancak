"use client";

import { useEffect, useRef, useState } from "react";
import { emblemSvgString } from "@/lib/brand/emblem";

/**
 * Hero'nun arka planı: gece stadyum ışığında dalgalanan kara sancak.
 * Grubun adı olan sancağı metinle anlatmak yerine sayfanın zemini yapar.
 *
 * Tek bir tam ekran üçgen çizilir; kumaş, ışık ve arma fragment shader'da hesaplanır.
 * cloth(): dalgalar direkten (sol) uca doğru ilerleyen yükseklik alanı. Işık sağ üstten
 * projektör ve soldan zayıf dolgu olarak gelir; alttan kırmızı meşale dumanı yükselir.
 * GLSL dizesine yorum yazmayın: ASCII dışı karakterler bazı sürücülerde derlemeyi bozar.
 * WebGL yoksa veya hareket azaltma tercih edilmişse sayfa statik armayla (ya da tek
 * kareyle) çalışmaya devam eder.
 */
const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAGMENT = `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime;
uniform sampler2D uEmblem;
uniform vec4 uBox;
uniform float uCalm;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float cloth(vec2 p) {
  float t = uTime;
  float h = 0.0;
  h += 0.52 * sin(p.x * 2.7 - t * 0.85 + p.y * 0.9);
  h += 0.30 * sin(p.x * 5.1 - t * 1.30 + p.y * 2.1 + 1.3);
  h += 0.13 * sin(p.x * 10.3 - t * 1.90 - p.y * 2.6 + 0.7);
  h += 0.05 * sin(p.x * 19.0 - t * 2.90 + p.y * 5.3 + 2.1);
  h += 0.30 * (noise(p * 1.5 + vec2(-t * 0.22, t * 0.09)) - 0.5);
  return h;
}
void main() {
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(vUv.x * aspect, vUv.y) * 1.3;
  float eps = 0.004;
  float h = cloth(p);
  vec2 grad = vec2(cloth(p + vec2(eps, 0.0)) - h, cloth(p + vec2(0.0, eps)) - h) / eps;
  vec3 n = normalize(vec3(-grad * 0.26, 1.0));
  vec2 uv = vUv + vec2(grad.x / aspect, grad.y) * 0.0065;
  vec2 q = (uv - uBox.xy) / uBox.zw * 0.5 + 0.5;
  vec4 art = vec4(0.0);
  if (q.x > 0.0 && q.x < 1.0 && q.y > 0.0 && q.y < 1.0) {
    art = texture2D(uEmblem, q);
  }
  vec3 fabric = vec3(0.034, 0.034, 0.038);
  vec3 color = mix(fabric, art.rgb, art.a);
  vec3 L1 = normalize(vec3(0.42, 0.72, 0.56));
  vec3 L2 = normalize(vec3(-0.62, 0.30, 0.72));
  vec3 V = vec3(0.0, 0.0, 1.0);
  float d1 = max(dot(n, L1), 0.0);
  float d2 = max(dot(n, L2), 0.0);
  float s1 = pow(max(dot(n, normalize(L1 + V)), 0.0), 34.0);
  float s2 = pow(max(dot(n, normalize(L2 + V)), 0.0), 18.0);
  vec3 lit = color * (0.20 + 1.12 * d1 + 0.34 * d2);
  float calm = mix(1.0 - uCalm, 1.0, smoothstep(0.06, 0.66, vUv.x));
  lit += vec3(0.86, 0.88, 0.92) * (s1 * 0.30 + s2 * 0.045) * calm;
  float weave = sin(gl_FragCoord.x * 1.7) * sin(gl_FragCoord.y * 1.7);
  lit *= 1.0 + weave * 0.018;
  float t = uTime;
  float smoke = noise(vec2(p.x * 1.15 - t * 0.04, p.y * 2.3 - t * 0.16))
              * noise(vec2(p.x * 2.6 + t * 0.03, p.y * 1.2 - t * 0.09) + 4.0);
  float smokeMask = smoothstep(0.34, 0.0, vUv.y);
  lit += vec3(0.62, 0.02, 0.04) * smoke * smokeMask * 1.05;
  float vignette = smoothstep(1.25, 0.25, length((vUv - vec2(0.62, 0.55)) * vec2(1.1, 1.25)));
  lit *= mix(0.45, 1.0, vignette);
  lit = mix(vec3(0.039, 0.039, 0.043), lit, smoothstep(0.0, 0.10, vUv.y));
  gl_FragColor = vec4(lit, 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Sancak gölgelendiricisi derlenemedi:", gl.getShaderInfoLog(shader));
    }
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function BannerCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      powerPreference: "low-power",
      // Grafik birimi yoksa (yazılımsal WebGL) işlemciyi yormak yerine statik armada kalınır.
      failIfMajorPerformanceCaveat: true,
    });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "uRes");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uBox = gl.getUniformLocation(program, "uBox");
    const uCalm = gl.getUniformLocation(program, "uCalm");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let visible = true;
    let textureReady = false;
    let disposed = false;
    let texture: WebGLTexture | null = null;
    // Zayıf grafik birimlerinde çözünürlük düşürülür. Kumaş düşük frekanslı olduğu için belli olmaz.
    let quality = 1;
    const start = performance.now();

    const render = (now: number) => {
      gl.uniform1f(uTime, reduceMotion ? 14 : (now - start) / 1000 + 14);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, rect.width < 800 ? 1.25 : 1.5) * quality;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);

      // Arma konumu, statik yedek görselle aynı (bkz. hero.tsx)
      const wide = rect.width >= 1024;
      const aspect = rect.width / rect.height;
      const halfHeight = wide ? 0.42 : 0.22;
      gl.uniform4f(
        uBox,
        wide ? 0.735 : 0.5,
        wide ? 0.5 : 0.72,
        halfHeight / aspect,
        halfHeight,
      );
      gl.uniform1f(uCalm, wide ? 0.72 : 0.5);
      if (textureReady) render(performance.now());
    };

    // Kumaş yavaş hareket eder: saniyede 30 kare yeter, pil ve ısı için üstüne çıkılmaz.
    const FRAME_MS = 1000 / 31;
    let lastFrame = 0;
    let windowStart = 0;
    let framesInWindow = 0;
    const loop = (now: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(loop);
      if (!visible || document.hidden) {
        windowStart = 0;
        return;
      }
      if (now - lastFrame < FRAME_MS) return;
      lastFrame = now;
      render(now);

      if (windowStart === 0) {
        windowStart = now;
        framesInWindow = 0;
      }
      framesInWindow += 1;
      if (now - windowStart > 1500) {
        const fps = (framesInWindow * 1000) / (now - windowStart);
        if (fps < 20 && quality > 0.5) {
          quality = Math.max(0.5, quality * 0.75);
          resize();
        }
        windowStart = now;
        framesInWindow = 0;
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    intersection.observe(canvas);

    const image = new Image();
    image.onload = () => {
      if (disposed) return;
      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      textureReady = true;
      resize();
      render(performance.now());
      setReady(true);
      if (!reduceMotion) frame = requestAnimationFrame(loop);
    };
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(emblemSvgString(1024))}`;

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      // Bağlam öldürülmez: React efekti yeniden çalıştırdığında aynı tuvalden
      // aynı bağlam döner (StrictMode, Activity). Yalnızca kaynaklar silinir.
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`${className ?? ""} transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}
    />
  );
}
