"use client"

import React, { useEffect, useRef } from 'react'

interface GPUFluidBackgroundProps {
  className?: string
  speed?: number
  scale?: number
  tint?: string
  opacity?: number
  fullscreen?: boolean
}

export function GPUFluidBackground({ className = "", speed = 1.0, scale = 1.0, tint = '#2463ff', opacity = 0.8, fullscreen = false }: GPUFluidBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    let animationId: number
    let resizeObserver: ResizeObserver

    const initCanvas = () => {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (!canvasRef.current) return

        const canvas = canvasRef.current
        const rect = canvas.getBoundingClientRect()
        const dpr = typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1

        // Set canvas drawing buffer size based on container size and devicePixelRatio
        const displayWidth = Math.max(Math.round(rect.width), 1)
        const displayHeight = Math.max(Math.round(rect.height), 1)
        canvas.style.width = displayWidth + 'px'
        canvas.style.height = displayHeight + 'px'
        canvas.width = Math.max(displayWidth * dpr, 1)
        canvas.height = Math.max(displayHeight * dpr, 1)

        // If dimensions are still tiny, use fallback values matching triangle preview
        if (canvas.width <= 1 || canvas.height <= 1) {
          const fallbackH = 224 // h-56
          canvas.style.width = '320px'
          canvas.style.height = `${fallbackH}px`
          canvas.width = 320 * dpr
          canvas.height = fallbackH * dpr
        }

        const ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

        if (!ctx) {
          console.warn('WebGL not supported, falling back to CSS animation')
          // Fallback: simple CSS-based fluid effect
          canvas.style.background = 'linear-gradient(45deg, #1a1a2e, #16213e, #0f3460, #16213e, #1a1a2e)'
          canvas.style.backgroundSize = '100% 100%'
          canvas.style.animation = 'fluidMove 6s ease-in-out infinite'
          const style = document.createElement('style')
          style.textContent = `
            @keyframes fluidMove {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
          `
          if (!document.getElementById('gpu-fluid-fallback-style')) {
            style.id = 'gpu-fluid-fallback-style'
            document.head.appendChild(style)
          }
          return
        }

      // Basic fluid simulation setup
      // This is a simplified version - in a real implementation you'd want to
      // implement proper fluid dynamics with shaders

      const gl = ctx as WebGLRenderingContext

      // Vertex shader
      const vertexShaderSource = `
        attribute vec2 a_position;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `

      // Fragment shader for fluid effect with customization uniforms
      const fragmentShaderSource = `
        precision mediump float;
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform float u_speed;
        uniform float u_scale;
        uniform vec3 u_tint;
        uniform float u_opacity;

        void main() {
          vec2 st = gl_FragCoord.xy / u_resolution.xy;

          // Simple fluid-like animation using speed/scale uniforms
          float s = u_scale;
          float t = u_time * u_speed;
          float wave = sin((st.x * 10.0 * s) + t * 2.0) * cos((st.y * 8.0 * s) + t * 1.5);
          wave += sin((st.x * 5.0 * s) - t) * sin((st.y * 6.0 * s) + t * 0.8);

          vec3 base;
          base.r = 0.1 + 0.4 * (sin(wave * 3.14159) * 0.5 + 0.5);
          base.g = 0.2 + 0.3 * (cos(wave * 2.0) * 0.5 + 0.5);
          base.b = 0.3 + 0.5 * (sin(wave * 1.5 + 1.0) * 0.5 + 0.5);

          // Apply tint and opacity
          vec3 tinted = base * u_tint;
          gl_FragColor = vec4(tinted, u_opacity);
        }
      `

      // Create and compile shaders
      const vertexShader = gl.createShader(gl.VERTEX_SHADER)
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)

      if (!vertexShader || !fragmentShader) {
        console.error('Failed to create shaders')
        return
      }

      gl.shaderSource(vertexShader, vertexShaderSource)
      gl.shaderSource(fragmentShader, fragmentShaderSource)

      gl.compileShader(vertexShader)
      if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('Vertex shader compilation failed:', gl.getShaderInfoLog(vertexShader))
        return
      }

      gl.compileShader(fragmentShader)
      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('Fragment shader compilation failed:', gl.getShaderInfoLog(fragmentShader))
        return
      }

      // Create program
      const program = gl.createProgram()
      if (!program) {
        console.error('Failed to create program')
        return
      }

      gl.attachShader(program, vertexShader)
      gl.attachShader(program, fragmentShader)
      gl.linkProgram(program)

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking failed:', gl.getProgramInfoLog(program))
        return
      }

      gl.useProgram(program)

      // Create buffer
      const positionBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

      // Quad vertices
      const positions = [
        -1, -1,
         1, -1,
        -1,  1,
         1,  1,
      ]
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

      // Get attribute location
      const positionAttributeLocation = gl.getAttribLocation(program, 'a_position')
      gl.enableVertexAttribArray(positionAttributeLocation)
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0)

      // Get uniform locations
      const timeUniformLocation = gl.getUniformLocation(program, 'u_time')
      const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution')
      const speedUniformLocation = gl.getUniformLocation(program, 'u_speed')
      const scaleUniformLocation = gl.getUniformLocation(program, 'u_scale')
      const tintUniformLocation = gl.getUniformLocation(program, 'u_tint')
      const opacityUniformLocation = gl.getUniformLocation(program, 'u_opacity')

      let startTime = Date.now()

      const render = () => {
        const currentTime = (Date.now() - startTime) / 1000

        gl.uniform1f(timeUniformLocation, currentTime)
        gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height)
        if (speedUniformLocation) gl.uniform1f(speedUniformLocation, speed)
        if (scaleUniformLocation) gl.uniform1f(scaleUniformLocation, scale)

        // Convert hex tint to normalized rgb
        try {
          const hex = tint.replace('#', '')
          const r = parseInt(hex.substring(0, 2), 16) / 255
          const g = parseInt(hex.substring(2, 4), 16) / 255
          const b = parseInt(hex.substring(4, 6), 16) / 255
          if (tintUniformLocation) gl.uniform3f(tintUniformLocation, r, g, b)
        } catch (e) {
          if (tintUniformLocation) gl.uniform3f(tintUniformLocation, 0.14, 0.39, 1.0)
        }
        if (opacityUniformLocation) gl.uniform1f(opacityUniformLocation, opacity)

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        animationId = requestAnimationFrame(render)
      }

      render()

      // Setup resize observer (updates drawing buffer respecting devicePixelRatio)
      resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => {
          if (!canvas) return
          const rect = canvas.getBoundingClientRect()
          const dpr = typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1
          const newDisplayW = Math.max(Math.round(rect.width), 1)
          const newDisplayH = Math.max(Math.round(rect.height), 1)
          const newW = newDisplayW * dpr
          const newH = newDisplayH * dpr
          if (newW > 0 && newH > 0 && (canvas.width !== newW || canvas.height !== newH)) {
            canvas.width = newW
            canvas.height = newH
            if (resolutionUniformLocation) gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height)
          }
        })
      })
      resizeObserver.observe(canvas)
      })
    }

    // Initialize canvas after DOM is ready
    requestAnimationFrame(initCanvas)

    // Cleanup function
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [speed, scale, tint, opacity])

  if (fullscreen) {
    return (
      <div className={className ? `${className} pointer-events-none fixed inset-0 z-0` : 'pointer-events-none fixed inset-0 z-0'} style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ width: '100%', height: '100%', background: 'transparent', display: 'block', pointerEvents: 'none' }}
        />
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className={className ? `${className}` : 'w-full h-full'}
      style={{ width: '100%', height: '100%', background: 'transparent', display: 'block', pointerEvents: 'none' }}
    />
  )
}