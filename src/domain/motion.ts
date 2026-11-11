import type { CartesianPosition } from './coordinates';

const RAD_PER_DEG = Math.PI / 180;

/** Returns the ICRS tangent direction represented by catalog proper-motion components. */
export function properMotionDirection(
  raDeg: number,
  decDeg: number,
  properMotionRaMasYr: number,
  properMotionDecMasYr: number,
): CartesianPosition | null {
  const magnitude = Math.hypot(properMotionRaMasYr, properMotionDecMasYr);
  if (!Number.isFinite(magnitude) || magnitude === 0) return null;
  const ra = raDeg * RAD_PER_DEG;
  const dec = decDeg * RAD_PER_DEG;
  const x =
    -Math.sin(ra) * properMotionRaMasYr - Math.cos(ra) * Math.sin(dec) * properMotionDecMasYr;
  const y =
    Math.cos(ra) * properMotionRaMasYr - Math.sin(ra) * Math.sin(dec) * properMotionDecMasYr;
  const z = Math.cos(dec) * properMotionDecMasYr;
  return { x: x / magnitude, y: y / magnitude, z: z / magnitude };
}
