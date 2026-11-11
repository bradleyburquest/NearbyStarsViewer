const SPECTRAL_COLORS: Readonly<Record<string, number>> = {
  O: 0x9bbcff,
  B: 0xaabfff,
  A: 0xcad7ff,
  F: 0xf8f7ff,
  G: 0xfff4d6,
  K: 0xffd2a1,
  M: 0xffaa73,
};

const DEFAULT_STAR_COLOR = 0xd8e5f2;

export function spectralClassFromType(spectralType: string | null): string | null {
  if (!spectralType) return null;
  const match = spectralType.toUpperCase().match(/[OBAFGKM]/);
  return match?.[0] ?? null;
}

export function spectralColor(spectralType: string | null): number {
  const spectralClass = spectralClassFromType(spectralType);
  return spectralClass
    ? (SPECTRAL_COLORS[spectralClass] ?? DEFAULT_STAR_COLOR)
    : DEFAULT_STAR_COLOR;
}

export function stellarColor(spectralType: string | null, gRpColorIndex: number | null): number {
  if (spectralType) return spectralColor(spectralType);
  if (gRpColorIndex === null) return DEFAULT_STAR_COLOR;
  if (gRpColorIndex < 0.15) return 0xaabfff;
  if (gRpColorIndex < 0.45) return 0xcad7ff;
  if (gRpColorIndex < 0.75) return 0xf8f7ff;
  if (gRpColorIndex < 1.05) return 0xfff4d6;
  if (gRpColorIndex < 1.45) return 0xffd2a1;
  return 0xffaa73;
}

export function markerRadius(apparentMagnitudeG: number | null, scaleByBrightness = false): number {
  if (!scaleByBrightness || apparentMagnitudeG === null) return 0.105;
  const normalizedBrightness = Math.max(0, Math.min(1, (12 - apparentMagnitudeG) / 14));
  return 0.07 + normalizedBrightness * 0.12;
}
