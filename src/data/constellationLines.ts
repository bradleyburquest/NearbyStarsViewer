import constellationLineData from './constellation-lines.json';

export type ConstellationLineFeature = Readonly<{
  id: string;
  name: string;
  rank: number;
  lines: readonly (readonly (readonly [number, number])[])[];
}>;

export const constellationLines =
  constellationLineData as unknown as readonly ConstellationLineFeature[];
