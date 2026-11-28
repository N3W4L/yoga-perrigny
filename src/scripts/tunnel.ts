/** One fullscreen pass: ring tunnel, mist, dust, grain, vignette. */

const VERT = `#version 300 es
in vec2 a;
void main() {
  gl_Position = vec4(a, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision mediump float;
uniform vec2 uRes;
uniform float uCam;
uniform float uTime;
out vec4 o;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 fog = vec3(0.031, 0.043, 0.035);
  vec3 glow = vec3(0.145, 0.220, 0.175);
  vec3 linen = vec3(0.851, 0.780, 0.643);
  vec3 sage = vec3(0.557, 0.643, 0.549);
  float breath = 0.94 + 0.06 * sin(uTime * 0.32);

  vec3 col = mix(glow, fog, smoothstep(0.0, 0.95, length(uv * vec2(0.85, 1.05))));
  vec3 dir = normalize(vec3(uv.x * 1.05, uv.y * 1.05 + 0.02, 1.0));

  for (int i = 0; i < 18; i++) {
    float k = float(i);
    float planeZ = k * 0.5;
    float t = (planeZ - uCam) / dir.z;
    if (t < 0.05 || t > 8.0) continue;
    vec2 p = dir.xy * t;
    float ang = 0.22 * sin(k * 1.3);
    float c = cos(ang);
    float s = sin(ang);
    vec2 q = mat2(c, -s, s, c) * p;
    float rx = (0.62 + 0.05 * sin(k * 0.9)) * breath;
    float ry = rx * (0.78 + 0.06 * cos(k));
    float e = length(q / vec2(rx, ry));
    float w = 0.012 + 0.02 * exp(-t * 0.55);
    float line = smoothstep(w, 0.0, abs(e - 1.0));
    float halo = exp(-abs(e - 1.0) * 14.0) * 0.22;
    float fade = exp(-t * 0.42);
    vec3 tint = mix(linen, sage, 0.5 + 0.5 * sin(k * 1.7));
    col += tint * (line * 0.9 + halo) * fade;
  }

  float mist = exp(-dot(uv, uv) * 2.4) * (0.16 + 0.04 * sin(uTime * 0.2));
  col += sage * mist;

  for (int i = 0; i < 22; i++) {
    float fi = float(i);
    float z = fract(hash(vec2(fi, 2.3)) * 3.0 + uTime * 0.015 - uCam * 0.12);
    float depth = 0.35 + z * 5.5;
    vec2 p = vec2(hash(vec2(fi, 4.1)), hash(vec2(fi, 8.2))) - 0.5;
    p *= vec2(1.7, 1.15);
    p.y += sin(uTime * 0.15 + fi) * 0.02;
    vec2 sp = p / depth;
    float d = length(uv - sp);
    float speck = smoothstep(0.0035, 0.0, d);
    col += linen * speck * (0.25 + 0.55 * hash(vec2(fi, 1.1))) * exp(-depth * 0.15);
  }

  float grain = hash(gl_FragCoord.xy + floor(uTime * 8.0)) - 0.5;
  col += grain * 0.045;
  float vig = smoothstep(0.25, 1.2, length(uv * vec2(0.78, 1.05)));
  col = mix(col, fog * 0.45, vig * 0.72);
  o = vec4(col, 1.0);
}
`;

export type Tunnel = {
  setCamera: (station: number, moving: boolean) => void;
  stop: () => void;
};

export function mountTunnel(canvas: HTMLCanvasElement | null): Tunnel | null {
  if (!canvas) return null;
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });
  if (!gl) return null;

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, 'a');
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, 'uRes');
  const uCam = gl.getUniformLocation(program, 'uCam');
  const uTime = gl.getUniformLocation(program, 'uTime');

  let cam = 0;
  let moving = false;
  let raf = 0;
  let timer = 0;
  let running = true;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  const draw = (now: number) => {
    resize();
    gl.useProgram(program);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uCam, cam);
    gl.uniform1f(uTime, now * 0.001);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const frame = (now: number) => {
    if (!running || document.hidden) {
      raf = 0;
      return;
    }
    draw(now);
    if (moving) raf = requestAnimationFrame(frame);
    else raf = 0;
  };

  const startIdle = () => {
    if (timer || !running) return;
    timer = window.setInterval(() => {
      if (!document.hidden) draw(performance.now());
    }, 1000 / 30);
  };

  const onHide = () => {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      return;
    }
    if (moving && !raf) raf = requestAnimationFrame(frame);
    else if (!moving) draw(performance.now());
  };
  document.addEventListener('visibilitychange', onHide);

  document.documentElement.classList.add('gl-scene');
  draw(performance.now());
  startIdle();

  return {
    setCamera(station, isMoving) {
      cam = station * 0.5;
      moving = isMoving;
      if (isMoving) {
        if (timer) {
          window.clearInterval(timer);
          timer = 0;
        }
        if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
      } else if (!timer) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        draw(performance.now());
        startIdle();
      }
    },
    stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      if (timer) window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onHide);
    },
  };
}
