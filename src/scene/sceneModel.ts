import type { StellarSystem } from '../domain/catalog';
import { sphericalToCartesian } from '../domain/coordinates';
import { markerRadius, stellarColor } from './starAppearance';

export type SceneSystem = Readonly<{
  id: string;
  name: string;
  xPc: number;
  yPc: number;
  zPc: number;
  color: number;
  radius: number;
}>;

export function toSceneSystem(
  system: StellarSystem,
  stellarColors = true,
  scaleByBrightness = false,
): SceneSystem {
  const position = sphericalToCartesian(
    system.astrometry.raDeg.value,
    system.astrometry.decDeg.value,
    system.distance.parsec,
  );

  return {
    id: system.id,
    name: system.displayName,
    xPc: position.x,
    yPc: position.y,
    zPc: position.z,
    color: stellarColors
      ? stellarColor(system.photometry.spectralType, system.photometry.gRpColorIndex?.value ?? null)
      : 0xd8e5f2,
    radius: markerRadius(system.photometry.apparentMagnitudeG?.value ?? null, scaleByBrightness),
  };
}
