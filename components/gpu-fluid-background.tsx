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

  // Refs to keep GL resources and current uniform values accessible across renders
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)
  const timeLocRef = useRef<WebGLUniformLocation | null>(null)
  const resolutionLocRef = useRef<WebGLUniformLocation | null>(null)
  const speedLocRef = useRef<WebGLUniformLocation | null>(null)
  const scaleLocRef = useRef<WebGLUniformLocation | null>(null)
  const tintLocRef = useRef<WebGLUniformLocation | null>(null)
  const opacityLocRef = useRef<WebGLUniformLocation | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const startTimeRef = useRef<number | null>(null)

  const speedRef = useRef<number>(speed)
  const scaleRef = useRef<number>(scale)
  const tintRef = useRef<string>(tint)
  const opacityRef = useRef<number>(opacity)

  // Initialize GL and shaders once
  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current

    const init = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1
      const displayWidth = Math.max(Math.round(rect.width), 1)
      const displayHeight = Math.max(Math.round(rect.height), 1)
      canvas.style.width = displayWidth + 'px'
      canvas.style.height = displayHeight + 'px'
      canvas.width = Math.max(displayWidth * dpr, 1)
      canvas.height = Math.max(displayHeight * dpr, 1)

      if (canvas.width <= 1 || canvas.height <= 1) {
        const fallbackH = 224
        canvas.style.width = '320px'
        canvas.style.height = `${fallbackH}px`
        canvas.width = 320 * dpr
        canvas.height = fallbackH * dpr
      }

      const ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (!ctx) {
        console.warn('WebGL not supported, falling back to CSS animation')
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

      const gl = ctx as WebGLRenderingContext
      glRef.current = gl

      // Vertex shader
      const vertexShaderSource = `
        attribute vec2 a_position;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `

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
          float s = u_scale;
          float t = u_time * u_speed;
          float wave = sin((st.x * 10.0 * s) + t * 2.0) * cos((st.y * 8.0 * s) + t * 1.5);
          wave += sin((st.x * 5.0 * s) - t) * sin((st.y * 6.0 * s) + t * 0.8);

          vec3 base;
          base.r = 0.1 + 0.4 * (sin(wave * 3.14159) * 0.5 + 0.5);
          base.g = 0.2 + 0.3 * (cos(wave * 2.0) * 0.5 + 0.5);
          base.b = 0.3 + 0.5 * (sin(wave * 1.5 + 1.0) * 0.5 + 0.5);

          vec3 tinted = base * u_tint;
          gl_FragColor = vec4(tinted, u_opacity);
        }
      `

      const createShader = (type: number, source: string) => {
        const shader = gl.createShader(type)
        if (!shader) return null
        gl.shaderSource(shader, source)
        gl.compileShader(shader)
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error('Shader compile error', gl.getShaderInfoLog(shader))
          return null
        }
        return shader
      }

      const vshader = createShader(gl.VERTEX_SHADER, vertexShaderSource)
      const fshader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource)
      if (!vshader || !fshader) return

      const program = gl.createProgram()
      if (!program) return
      gl.attachShader(program, vshader)
      gl.attachShader(program, fshader)
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking failed:', gl.getProgramInfoLog(program))
        return
      }
      programRef.current = program
      gl.useProgram(program)

      const positionBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      const positions = [-1, -1, 1, -1, -1, 1, 1, 1]
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

      const positionAttributeLocation = gl.getAttribLocation(program, 'a_position')
      gl.enableVertexAttribArray(positionAttributeLocation)
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0)

      // Uniform locations
      timeLocRef.current = gl.getUniformLocation(program, 'u_time')
      resolutionLocRef.current = gl.getUniformLocation(program, 'u_resolution')
      speedLocRef.current = gl.getUniformLocation(program, 'u_speed')
      scaleLocRef.current = gl.getUniformLocation(program, 'u_scale')
      tintLocRef.current = gl.getUniformLocation(program, 'u_tint')
      opacityLocRef.current = gl.getUniformLocation(program, 'u_opacity')

      startTimeRef.current = Date.now()

      const render = () => {
        if (!glRef.current || !programRef.current) return
        const gl = glRef.current
        const now = (Date.now() - (startTimeRef.current || Date.now())) / 1000

        if (timeLocRef.current) gl.uniform1f(timeLocRef.current, now)
        if (resolutionLocRef.current) gl.uniform2f(resolutionLocRef.current, canvas.width, canvas.height)
        if (speedLocRef.current) gl.uniform1f(speedLocRef.current, speedRef.current)
        if (scaleLocRef.current) gl.uniform1f(scaleLocRef.current, scaleRef.current)

        // Convert hex tint
        try {
          const hex = (tintRef.current || '#2463ff').replace('#', '')
          const r = parseInt(hex.substring(0, 2), 16) / 255
          const g = parseInt(hex.substring(2, 4), 16) / 255
          const b = parseInt(hex.substring(4, 6), 16) / 255
          if (tintLocRef.current) gl.uniform3f(tintLocRef.current, r, g, b)
        } catch (e) {
          if (tintLocRef.current) gl.uniform3f(tintLocRef.current, 0.14, 0.39, 1.0)
        }
        if (opacityLocRef.current) gl.uniform1f(opacityLocRef.current, opacityRef.current)

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        animationIdRef.current = requestAnimationFrame(render)
      }

      render()

      // Resize observer
      resizeObserverRef.current = new ResizeObserver(() => {
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
            if (resolutionLocRef.current && glRef.current) glRef.current.uniform2f(resolutionLocRef.current, canvas.width, canvas.height)
          }
        })
      })
      if (resizeObserverRef.current) resizeObserverRef.current.observe(canvas)
    }

    // ensure DOM layout settled
    const raf = requestAnimationFrame(init)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current)
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect()
      // Note: we don't explicitly delete GL program/shaders here for brevity
    }
  }, [])

  // Sync prop values into refs and update uniforms immediately when possible
  useEffect(() => {
    speedRef.current = speed
    scaleRef.current = scale
    tintRef.current = tint
    opacityRef.current = opacity

    const gl = glRef.current
    if (!gl || !programRef.current) return
    gl.useProgram(programRef.current)
    if (speedLocRef.current) gl.uniform1f(speedLocRef.current, speedRef.current)
    if (scaleLocRef.current) gl.uniform1f(scaleLocRef.current, scaleRef.current)
    // update tint
    try {
      const hex = (tintRef.current || '#2463ff').replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16) / 255
      const g = parseInt(hex.substring(2, 4), 16) / 255
      const b = parseInt(hex.substring(4, 6), 16) / 255
      if (tintLocRef.current) gl.uniform3f(tintLocRef.current, r, g, b)
    } catch (e) {
      if (tintLocRef.current) gl.uniform3f(tintLocRef.current, 0.14, 0.39, 1.0)
    }
    if (opacityLocRef.current) gl.uniform1f(opacityLocRef.current, opacityRef.current)
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