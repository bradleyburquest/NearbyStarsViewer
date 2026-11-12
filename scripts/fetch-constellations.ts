import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const sourceUrl =
  'https://dieghernan.github.io/celestial_data/data/constellations.lines.min.geojson';
const outputUrl = new URL('../src/data/constellation-lines.json', import.meta.url);
const response = await fetch(sourceUrl);
if (!response.ok) throw new Error(`Constellation line download failed: HTTP ${response.status}`);
const payload: unknown = await response.json();
if (
  !payload ||
  typeof payload !== 'object' ||
  !('features' in payload) ||
  !Array.isArray(payload.features)
)
  throw new Error('Constellation line download was not a GeoJSON feature collection.');
const compactFeatures = payload.features.map((feature: unknown) => {
  if (
    !feature ||
    typeof feature !== 'object' ||
    !('properties' in feature) ||
    !('geometry' in feature)
  )
    throw new Error('Constellation feature is malformed.');
  const properties = feature.properties as Record<string, unknown>;
  const geometry = feature.geometry as Record<string, unknown>;
  if (!Array.isArray(geometry.coordinates)) throw new Error('Constellation geometry is malformed.');
  return {
    id: properties.id,
    name: properties.name,
    rank: properties.rank,
    lines: geometry.coordinates,
  };
});
await writeFile(fileURLToPath(outputUrl), `${JSON.stringify(compactFeatures)}\n`, 'utf8');
console.log(
  `Wrote ${compactFeatures.length} compact constellation features to ${fileURLToPath(outputUrl)}.`,
);
