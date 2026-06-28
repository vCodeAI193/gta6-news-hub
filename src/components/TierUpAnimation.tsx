/**
 * Wave 6 Phase 2: Tier-Up Animations Component
 * Particle effects, confetti, sound effects when leveling up tier
 */

import React, { useEffect, useRef } from 'react'

interface TierUpAnimationProps {
  isVisible: boolean
  fromTier: string
  toTier: string
  reward: string
  onComplete?: () => void
}

const Confetti: React.FC<{ x: number; y: number; delay: number }> = ({ x, y, delay }) => {
  return (
    <div
      className="confetti-piece"
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        pointerEvents: 'none',
        animation: `confetti-fall 3s ease-out ${delay}ms forwards`,
        zIndex: 9999,
      }}
    >
      {['🎉', '✨', '🌟', '🎊'][Math.floor(Math.random() * 4)]}
    </div>
  )
}

export const TierUpAnimation: React.FC<TierUpAnimationProps> = ({
  isVisible,
  fromTier,
  toTier,
  reward,
  onComplete,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const confettiPiecesRef = useRef<Array<{ x: number; y: number; delay: number }>>([])

  useEffect(() => {
    if (!isVisible) {
      confettiPiecesRef.current = []
      return
    }

    // Play sound effect
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {
        // Audio play may fail in some contexts
      })
    }

    // Generate confetti pieces
    const pieces = []
    for (let i = 0; i < 30; i++) {
      pieces.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * -50 - 20,
        delay: Math.random() * 200,
      })
    }
    confettiPiecesRef.current = pieces

    // Auto-complete after animation
    const timer = setTimeout(() => {
      onComplete?.()
    }, 3500)

    return () => clearTimeout(timer)
  }, [isVisible, onComplete])

  if (!isVisible) return null

  return (
    <div className="tier-up-animation-container">
      {/* Hidden audio element for sound effect */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==" />
        <track kind="captions" />
      </audio>

      {/* Overlay background */}
      <div
        className="tier-up-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 9998,
          animation: 'fadeInOut 3.5s ease-out forwards',
        }}
      />

      {/* Main tier-up notification */}
      <div
        className="tier-up-notification"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          textAlign: 'center',
          animation: 'popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
        }}
      >
        <div className="tier-up-content">
          <div className="tier-up-emoji" style={{ fontSize: '80px', marginBottom: '16px' }}>
            🎊
          </div>

          <h1
            className="tier-up-title"
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#ffd700',
              textShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
              margin: '8px 0',
            }}
          >
            TIER UP!
          </h1>

          <p
            className="tier-up-transition"
            style={{
              fontSize: '20px',
              color: '#fff',
              margin: '12px 0',
            }}
          >
            {fromTier} → <span style={{ fontWeight: 'bold', color: '#ffd700' }}>{toTier}</span>
          </p>

          <div
            className="tier-up-reward"
            style={{
              fontSize: '18px',
              color: '#4ade80',
              fontWeight: 'bold',
              marginTop: '16px',
              padding: '12px 20px',
              backgroundColor: 'rgba(74, 222, 128, 0.2)',
              borderRadius: '8px',
              border: '2px solid #4ade80',
            }}
          >
            🎁 Reward: {reward}
          </div>

          {/* Particle ring effect */}
          <div
            style={{
              position: 'absolute',
              width: '200px',
              height: '200px',
              border: '3px solid #ffd700',
              borderRadius: '50%',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'expandRing 0.8s ease-out forwards',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '300px',
              height: '300px',
              border: '2px solid #ff6b6b',
              borderRadius: '50%',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'expandRing 1s ease-out 0.1s forwards',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '400px',
              height: '400px',
              border: '1px solid #60a5fa',
              borderRadius: '50%',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'expandRing 1.2s ease-out 0.2s forwards',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* Confetti pieces */}
      {confettiPiecesRef.current.map((piece, idx) => (
        <Confetti key={idx} x={piece.x} y={piece.y} delay={piece.delay} />
      ))}

      {/* CSS Animations */}
      <style>{`
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.3);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes expandRing {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(0.5);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(2);
          }
        }

        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(600px) rotate(720deg) scale(0);
          }
        }

        @keyframes fadeInOut {
          0% {
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            opacity: 0;
          }
        }

        .tier-up-notification {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 3px solid #ffd700;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 0 50px rgba(255, 215, 0, 0.5), 0 0 30px rgba(255, 107, 107, 0.3);
          min-width: 300px;
        }

        .tier-up-content {
          position: relative;
          z-index: 1;
        }
      `}</style>
    </div>
  )
}

export default TierUpAnimation
