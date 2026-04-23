<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  let canvas: HTMLCanvasElement;
  let gl: WebGLRenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let animId: number;
  let startTime = Date.now();

  const vs = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  const fs = `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_res;

    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float smoothNoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = noise(i);
      float b = noise(i + vec2(1.0, 0.0));
      float c = noise(i + vec2(0.0, 1.0));
      float d = noise(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float val = 0.0;
      float amp = 0.5;
      float freq = 1.0;
      for(int i = 0; i < 5; i++) {
        val += amp * smoothNoise(p * freq);
        amp *= 0.5;
        freq *= 2.1;
      }
      return val;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_res;
      float t = u_time * 0.08;

      vec2 q = vec2(fbm(uv + t * 0.3), fbm(uv + vec2(1.7, 9.2) + t * 0.25));
      vec2 r = vec2(fbm(uv + 4.0 * q + vec2(1.7, 9.2) + t * 0.18),
                    fbm(uv + 4.0 * q + vec2(8.3, 2.8) + t * 0.22));

      float f = fbm(uv + 4.0 * r);

      // Saheli palette: deep pink → light pink → soft purple
      vec3 col1 = vec3(0.95, 0.55, 0.65); // #F38DA7 deep pink
      vec3 col2 = vec3(0.98, 0.84, 0.88); // #FAD6E0 light pink  
      vec3 col3 = vec3(0.82, 0.72, 0.92); // #D1B8EB soft purple
      vec3 col4 = vec3(0.99, 0.96, 0.97); // near white

      vec3 color = mix(col1, col2, clamp(f * 2.0, 0.0, 1.0));
      color = mix(color, col3, clamp((f - 0.5) * 2.0, 0.0, 1.0));
      color = mix(color, col4, clamp((f - 0.75) * 4.0, 0.0, 1.0));

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function compileShader(type: number, src: string) {
    const s = gl!.createShader(type)!;
    gl!.shaderSource(s, src);
    gl!.compileShader(s);
    return s;
  }

  onMount(() => {
    gl = canvas.getContext('webgl');
    if (!gl) return;

    const vert = compileShader(gl.VERTEX_SHADER, vs);
    const frag = compileShader(gl.FRAGMENT_SHADER, fs);
    program = gl.createProgram()!;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl!.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener('resize', resize);

    function render() {
      const t = (Date.now() - startTime) / 1000;
      const uTime = gl!.getUniformLocation(program!, 'u_time');
      const uRes = gl!.getUniformLocation(program!, 'u_res');
      gl!.uniform1f(uTime, t);
      gl!.uniform2f(uRes, canvas.width, canvas.height);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    }
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  });
</script>

<canvas
  bind:this={canvas}
  class="fluid-bg"
  aria-hidden="true"
></canvas>

<style>
  .fluid-bg {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    z-index: 0;
    pointer-events: none;
    filter: blur(48px) saturate(1.4);
    opacity: 0.55;
  }
</style>
