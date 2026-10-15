/**
 * High-performance WebGL Gravitational Lensing & Accretion Disk Renderer
 * Renders an authentic Schwarzschild black hole with an accretion disk,
 * relativistic Doppler beaming, photon ring, and gravitational lensing.
 */

export interface RendererOptions {
  canvas: HTMLCanvasElement;
}

export interface BlackHoleRenderer {
  ready: Promise<void>;
  dispose: () => void;
}

const VERTEX_SHADER_SOURCE = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
varying vec2 vUv;

#define PI 3.14159265359

// Procedural noise for accretion disk plasma
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.0 + vec2(100.0);
    a *= 0.5;
  }
  return v;
}

// Background Starfield
vec3 backgroundStars(vec2 dir) {
  float n = hash(floor(dir * 250.0));
  float star = step(0.993, n) * pow(hash(floor(dir * 250.0) + 1.2), 3.0);
  return vec3(star * 0.85);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
  
  // Subtle interactive mouse tilt
  vec2 mouseOffset = (u_mouse - 0.5) * 0.2;
  uv += mouseOffset * 0.3;

  float r = length(uv);
  float theta = atan(uv.y, uv.x);

  // Black Hole Parameters
  float r_horizon = 0.17;       // Event horizon radius
  float r_photon = 0.23;        // Photon sphere / Einstein ring radius
  float r_disk_inner = 0.26;    // Inner accretion disk
  float r_disk_outer = 0.70;    // Outer accretion disk

  // Gravitational light bending distortion
  // Light rays curving around the Schwarzschild black hole
  float bend = 0.045 / (r + 0.001);
  vec2 lensedUv = uv * (1.0 + bend);

  // Background stars distorted by lensing
  vec3 col = backgroundStars(lensedUv);

  // Accretion Disk 3D Projection (Tilted Plane)
  // Perspective projection of an inclined flat disc
  float tilt = 0.38; // Tilt angle factor
  vec2 diskUv = uv;
  diskUv.y /= tilt; // compress along Y for ellipse tilt
  float diskR = length(diskUv);
  float diskTheta = atan(diskUv.y, diskUv.x);

  // Accretion disk volumetric dust and plasma
  if (diskR >= r_disk_inner && diskR <= r_disk_outer) {
    float diskNorm = (diskR - r_disk_inner) / (r_disk_outer - r_disk_inner);
    
    // Orbital rotation speed (Keplerian: faster inside)
    float speed = 1.2 / (diskR * 2.5);
    float angle = diskTheta - u_time * speed * 0.8;
    
    // Swirling turbulent plasma filaments
    vec2 polarP = vec2(diskR * 12.0, angle * 4.0);
    float plasma = fbm(polarP);
    float plasmaDetail = fbm(polarP * 2.5 - vec2(u_time * 1.5, 0.0));
    float density = (plasma * 0.65 + plasmaDetail * 0.35);

    // Radial intensity falloff (bell curve near inner edge)
    float edgeGlow = sin(diskNorm * PI);
    edgeGlow = pow(edgeGlow, 1.4);

    // Relativistic Doppler beaming (approaching side is brighter and bluer/hotter)
    // Left side is approaching in our rotation direction
    float doppler = 1.0 - 0.55 * cos(diskTheta);

    // Accretion Color Gradient (Hyper-hot golden white near center to deep amber/copper outside)
    vec3 hotColor = vec3(1.0, 0.95, 0.85); // High energy core
    vec3 warmColor = vec3(1.0, 0.65, 0.25); // Mid plasma
    vec3 coolColor = vec3(0.7, 0.25, 0.08); // Outer dust

    vec3 diskCol = mix(hotColor, warmColor, smoothstep(0.0, 0.45, diskNorm));
    diskCol = mix(diskCol, coolColor, smoothstep(0.45, 1.0, diskNorm));

    float intensity = density * edgeGlow * doppler * 2.8;
    col += diskCol * intensity;
  }

  // Photon Sphere / Einstein Ring (Intense gravitational light accumulation)
  float ringDist = abs(r - r_photon);
  float ringGlow = exp(-ringDist * 45.0) * 1.6;
  // Gravitational redshift near photon ring
  vec3 ringColor = vec3(1.0, 0.88, 0.65);
  col += ringColor * ringGlow;

  // Secondary Einstein lensing halo
  float outerHalo = exp(-abs(r - r_horizon * 1.55) * 18.0) * 0.5;
  col += vec3(0.9, 0.6, 0.3) * outerHalo;

  // Event Horizon (Absolute darkness inside Schwarzschild radius)
  float horizonEdge = smoothstep(r_horizon - 0.005, r_horizon + 0.005, r);
  col *= horizonEdge;

  // Soft atmospheric cosmic dust vignette
  col += vec3(0.04, 0.02, 0.06) * (1.0 - smoothstep(0.1, 1.2, r));

  // Contrast and cinematic tone mapping
  col = col / (1.0 + col); // Reinhard tone mapping
  col = pow(col, vec3(0.9)); // Slight gamma adjustment

  gl_FragColor = vec4(col, 1.0);
}
`;

export function createRenderer({ canvas }: RendererOptions): BlackHoleRenderer {
  let animationFrameId: number;
  let isDisposed = false;

  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
  });

  if (!gl) {
    // Graceful 2D canvas fallback if WebGL is unavailable
    const ctx = canvas.getContext('2d');
    let angle = 0;

    const render2D = () => {
      if (isDisposed || !ctx) return;
      const width = (canvas.width = canvas.clientWidth);
      const height = (canvas.height = canvas.clientHeight);

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const r = Math.min(width, height) * 0.18;

      // Glow ring
      const grad = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 2.2);
      grad.addColorStop(0, 'rgba(255, 200, 120, 0.9)');
      grad.addColorStop(0.3, 'rgba(255, 120, 30, 0.5)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.scale(1, 0.4);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Black Hole core
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      angle += 0.015;
      animationFrameId = requestAnimationFrame(render2D);
    };

    render2D();

    return {
      ready: Promise.resolve(),
      dispose: () => {
        isDisposed = true;
        cancelAnimationFrame(animationFrameId);
      },
    };
  }

  // Compile WebGL shaders
  const createShader = (type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('Shader compile failed:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const vertexShader = createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);

  if (!vertexShader || !fragmentShader) {
    return {
      ready: Promise.resolve(),
      dispose: () => {},
    };
  }

  const program = gl.createProgram();
  if (!program) {
    return {
      ready: Promise.resolve(),
      dispose: () => {},
    };
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('Program linking failed:', gl.getProgramInfoLog(program));
  }

  gl.useProgram(program);

  // Quad geometry covering whole viewport
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  );

  const positionLocation = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(program, 'u_resolution');
  const uTime = gl.getUniformLocation(program, 'u_time');
  const uMouse = gl.getUniformLocation(program, 'u_mouse');

  let mouseX = 0.5;
  let mouseY = 0.5;
  let targetMouseX = 0.5;
  let targetMouseY = 0.5;

  const handleMouseMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      targetMouseX = (e.clientX - rect.left) / rect.width;
      targetMouseY = 1.0 - (e.clientY - rect.top) / rect.height;
    }
  };

  window.addEventListener('mousemove', handleMouseMove, { passive: true });

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.floor(canvas.clientWidth * dpr);
    const height = Math.floor(canvas.clientHeight * dpr);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  };

  const startTime = performance.now();

  const render = () => {
    if (isDisposed) return;

    resize();

    const elapsed = (performance.now() - startTime) / 1000;
    // Smooth mouse inertia
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    gl.useProgram(program);
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform1f(uTime, elapsed);
    gl.uniform2f(uMouse, mouseX, mouseY);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    animationFrameId = requestAnimationFrame(render);
  };

  render();

  return {
    ready: Promise.resolve(),
    dispose: () => {
      isDisposed = true;
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      if (positionBuffer) gl.deleteBuffer(positionBuffer);
      if (program) gl.deleteProgram(program);
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
    },
  };
}
