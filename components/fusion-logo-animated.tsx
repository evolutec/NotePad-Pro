import React from "react"
import { motion } from "framer-motion"

interface FusionLogoAnimatedProps {
  size?: number
  rotationSpeed?: number
  breathing?: boolean
  halo?: boolean
}

/**
 * FusionLogoAnimated
 * -------------------
 * Animation du logo Fusion :
 * - Rotation 3D douce
 * - Halo lumineux pulsant
 * - Respiration légère de la sphère centrale
 *
 * Props :
 * - size : taille du logo (par défaut 240px)
 * - rotationSpeed : durée d'une rotation complète en secondes (par défaut 20s)
 * - breathing : active l'effet de respiration de la sphère
 * - halo : active le halo lumineux externe
 */

export const FusionLogoAnimated: React.FC<FusionLogoAnimatedProps> = ({
  size = 240,
  rotationSpeed = 20,
  breathing = true,
  halo = true
}) => {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Halo lumineux autour */}
      {halo && (
        <motion.div
          className="absolute rounded-full blur-3xl"
          style={{
            width: size * 1.6,
            height: size * 1.6,
            background:
              "conic-gradient(from 0deg, #1E6FE8, #20A64A, #FF7A2D, #1E6FE8)"
          }}
          animate={{
            rotate: [0, 360]
          }}
          transition={{
            repeat: Infinity,
            duration: rotationSpeed * 2,
            ease: "linear"
          }}
        />
      )}

      {/* Sphère centrale (effet respiration) */}
      <motion.div
        className="absolute rounded-full bg-white shadow-2xl"
        style={{
          width: size * 0.45,
          height: size * 0.45,
          boxShadow: "inset 0 4px 12px rgba(0,0,0,0.15)"
        }}
        animate={
          breathing
            ? { scale: [1, 1.05, 1] }
            : {}
        }
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Arcs colorés (rotation continue) */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: rotationSpeed,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute w-full h-full"
      >
        <svg
          viewBox="0 0 240 240"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <radialGradient id="core" cx="50%" cy="45%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e6e9ee" />
            </radialGradient>

            <linearGradient id="b" x1="0" x2="1">
              <stop offset="0%" stopColor="#1E6FE8" />
              <stop offset="100%" stopColor="#1462D6" />
            </linearGradient>
            <linearGradient id="g" x1="0" x2="1">
              <stop offset="0%" stopColor="#20A64A" />
              <stop offset="100%" stopColor="#0E8A3F" />
            </linearGradient>
            <linearGradient id="o" x1="0" x2="1">
              <stop offset="0%" stopColor="#FF7A2D" />
              <stop offset="100%" stopColor="#D9480F" />
            </linearGradient>
          </defs>

          {/* Bleu */}
          <path
            d="M120 18 C170 18 210 58 210 108 L180 120 C180 80 150 48 120 48 Z"
            fill="url(#b)"
          />
          {/* Vert */}
          <path
            d="M210 108 C210 158 170 198 120 198 L108 168 C150 168 184 142 184 108 Z"
            fill="url(#g)"
          />
          {/* Orange */}
          <path
            d="M120 198 C70 198 30 158 30 108 L60 96 C60 136 90 168 120 168 Z"
            fill="url(#o)"
          />
        </svg>
      </motion.div>
    </div>
  )
}
