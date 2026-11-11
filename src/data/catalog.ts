import nearbyStarsCatalogData from './nearby-stars-catalog.json';
import { stellarCatalogSchema, type StellarCatalog } from '../domain/catalog';

export function validateCatalog(input: unknown): StellarCatalog {
  return stellarCatalogSchema.parse(input);
}

export const nearbyStarsCatalog = validateCatalog(nearbyStarsCatalogData);
