import { nearbyStarsCatalog } from '../src/data/catalog';
import { sphericalToCartesian, vectorMagnitude } from '../src/domain/coordinates';

const rows = nearbyStarsCatalog.systems.map((system) => {
  const position = sphericalToCartesian(
    system.astrometry.raDeg.value,
    system.astrometry.decDeg.value,
    system.distance.parsec,
  );

  const radialError = Math.abs(vectorMagnitude(position) - system.distance.parsec);
  if (radialError > 1e-10) {
    throw new Error(`${system.id} Cartesian radius differs from its catalog distance.`);
  }

  return {
    id: system.id,
    name: system.displayName,
    distancePc: system.distance.parsec.toFixed(4),
    xPc: position.x.toFixed(4),
    yPc: position.y.toFixed(4),
    zPc: position.z.toFixed(4),
  };
});

console.table([rows[0], rows.at(-1)]);
console.log(
  `Validated ${nearbyStarsCatalog.systems.length} systems against schema ${nearbyStarsCatalog.schemaVersion}.`,
);
