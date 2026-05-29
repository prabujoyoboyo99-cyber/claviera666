export const DEFAULT_CODE = `import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

export const VibeGraphic: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Entrance animations (staggered)
  const cardScale = spring({
    fps,
    frame,
    config: { damping: 12, mass: 0.9, stiffness: 100 },
    from: 0.8,
    to: 1,
  });

  const cardOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const stripeProgress = spring({
    fps,
    frame: frame - 15,
    config: { damping: 12 },
    from: 0,
    to: 1,
  });

  const chipProgress = spring({
    fps,
    frame: frame - 30,
    config: { damping: 12 },
    from: 0,
    to: 1,
  });

  const logoProgress = spring({
    fps,
    frame: frame - 45,
    config: { damping: 12 },
    from: 0,
    to: 1,
  });

  // Idle camera drift
  const drift = Math.sin(frame * 0.04) * 8;
  const tilt = Math.sin(frame * 0.03) * 4;

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at 30% 20%, #3b1d6e 0%, #1a1030 45%, #0b0712 100%)',
        fontFamily: 'Geist, system-ui, sans-serif',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: width * 0.42,
          height: width * 0.42 * 0.63,
          borderRadius: 28,
          background:
            'linear-gradient(135deg, rgba(124,58,237,0.9), rgba(56,30,110,0.95))',
          boxShadow: '0 40px 120px rgba(124,58,237,0.45)',
          transform: \`scale(\${cardScale}) translateY(\${drift}px) rotate(\${tilt * 0.2}deg)\`,
          opacity: cardOpacity,
          position: 'relative',
          padding: 36,
          boxSizing: 'border-box',
        }}
      >
        {/* Magnetic stripe */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 0,
            width: '100%',
            height: 46,
            background: 'rgba(0,0,0,0.45)',
            transform: \`scaleX(\${stripeProgress})\`,
            transformOrigin: 'left',
          }}
        />

        {/* Chip */}
        <div
          style={{
            position: 'absolute',
            bottom: 120,
            left: 40,
            width: 64,
            height: 48,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #f5d47a, #c9972f)',
            transform: \`scale(\${chipProgress})\`,
          }}
        />

        {/* Logo */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 40,
            color: '#fff',
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: 1,
            opacity: logoProgress,
            transform: \`translateX(\${(1 - logoProgress) * 20}px)\`,
          }}
        >
          VIBE
        </div>
      </div>
    </div>
  );
};
`
