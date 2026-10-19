import React, { useEffect, useRef } from 'react';

export default function WebGLBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl', { alpha: false, depth: false, antialias: true }) || 
           (canvas.getContext('experimental-webgl') as WebGLRenderingContext);
    } catch {
      // Fallback below
    }

    if (!gl) {
      console.warn('WebGL not supported, falling back to CSS luxury background');
      return;
    }

    // Vertex Shader code
    const vsSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment Shader - Fractal Brushstroke Shader with gold, silver and black fluid tones
    const fsSource = `
      precision highp float;
      
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_time;

      // Classic 2D Simplex Noise by Ian McEwan, Ashima Arts
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
      
      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                            0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                           -0.577350269189626,  // -1.0 + 2.0 * C.x
                            0.024390243902439); // 1.0 / 41.0
        // First corner
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);

        // Other corners
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;

        // Permutations
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
               + i.x + vec3(0.0, i1.x, 1.0));

        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
        m = m * m;
        m = m * m;

        // Gradients
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;

        // Normalise gradients implicitly by scaling m
        m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

        // Compute final noise value at P
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      // Fractal Brownian Motion for rich brushstrokes
      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        for (int i = 0; i < 4; i++) {
          value += amplitude * snoise(p * frequency);
          frequency *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
        
        // Incorporate subtle interactive mouse distortion
        vec2 m = (u_mouse - 0.5 * u_resolution.xy) / u_resolution.y;
        float distToMouse = length(p - m);
        float mouseAttract = smoothstep(0.8, 0.0, distToMouse);
        
        // Fluid flow warp domain (domain warping)
        vec2 q = vec2(0.0);
        q.x = fbm(p * 1.5 + vec2(u_time * 0.04, u_time * 0.04) + m * 0.2);
        q.y = fbm(p * 1.5 + vec2(1.0, 3.0) + vec2(u_time * 0.03, u_time * 0.03));
        
        vec2 r = vec2(0.0);
        r.x = fbm(p * 2.5 + q * 1.8 + vec2(u_time * 0.05, 5.2));
        r.y = fbm(p * 2.5 + q * 2.0 + vec2(2.1, u_time * 0.02 + mouseAttract * 0.2));
        
        // Base noise factor for brush strokes
        float stroke = fbm(p * 3.0 + r * 2.2);
        
        // Premium Luxury Palette Tones
        // Pure Gold tone
        vec3 colGold = vec3(0.835, 0.686, 0.282); // Luxury Gold
        // Deep Gold/Bronze Tone
        vec3 colBronze = vec3(0.537, 0.388, 0.133); 
        // Platinum / Silver brush lines
        vec3 colSilver = vec3(0.80, 0.81, 0.84); 
        // Black / Deep Dark Charcoal
        vec3 colBlack = vec3(0.027, 0.027, 0.029); 

        // Let space and mouse determine mixing amounts
        float mixGold = smoothstep(-0.3, 0.5, stroke);
        float mixSilver = smoothstep(0.4, 0.9, stroke + 0.1 * snoise(p * 15.0));
        float mixCharcoal = smoothstep(-0.8, -0.2, stroke);

        // Fluid mixture computation
        vec3 color = colBlack;
        color = mix(color, colBronze, mixCharcoal);
        color = mix(color, colGold, mixGold);
        // Highlight details using silver/platinum streaks
        color = mix(color, colSilver, mixSilver * 0.55);

        // Add standard delicate gold glitter specs
        float glitter = snoise(p * 50.0 + r * 10.0 + vec2(u_time * 0.15, u_time * 0.15));
        if (glitter > 0.88) {
          float sparkle = smoothstep(0.88, 1.0, glitter);
          color += colGold * sparkle * 0.65;
        }

        // Vignette effect for elegant frame finish
        float vignette = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
        vignette = clamp(pow(vignette * 15.0, 0.35), 0.0, 1.0);
        color *= vignette;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // Compile Helper function
    function createShader(glContext: WebGLRenderingContext, source: string, type: number): WebGLShader | null {
      const shader = glContext.createShader(type);
      if (!shader) return null;
      glContext.shaderSource(shader, source);
      glContext.compileShader(shader);
      if (!glContext.getShaderParameter(shader, glContext.COMPILE_STATUS)) {
        console.error('Shader compilation error: ', glContext.getShaderInfoLog(shader));
        glContext.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl, vsSource, gl.VERTEX_SHADER);
    const fs = createShader(gl, fsSource, gl.FRAGMENT_SHADER);

    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error: ', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Quad geometry positions
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const posAttrib = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posAttrib);
    gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uTime = gl.getUniformLocation(program, 'u_time');

    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      // Convert browser coordinates to WebGL Y-up coordinate system
      mouseY = window.innerHeight - e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize handling details
    const handleResize = () => {
      if (!canvas || !gl) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    let animationFrameId = 0;
    const startTime = Date.now();

    const renderLoop = () => {
      if (!gl || !canvas) return;
      const elapsed = (Date.now() - startTime) / 1000.0;

      // Smooth mouse interpolation
      currentX += (mouseX - currentX) * 0.08;
      currentY += (mouseY - currentY) * 0.08;

      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform2f(uMouse, currentX, currentY);
      gl.uniform1f(uTime, elapsed);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (gl) {
        gl.deleteBuffer(posBuffer);
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
      }
    };
  }, []);

  return (
    <>
      {/* Real-time Shader canvas layered behind UI */}
      <canvas
        id="luxury-webgl-canvas"
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
        style={{ opacity: 0.52 }}
      />
      {/* High-end ambient backlight shadows to secure deep dark feel */}
      <div 
        id="bg-luxury-glow" 
        className="fixed inset-0 w-full h-full pointer-events-none -z-10 bg-radial from-transparent via-[#050505]/40 to-[#020202]/95" 
      />
    </>
  );
}
