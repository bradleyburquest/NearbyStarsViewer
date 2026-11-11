const baseUrl = process.env.NSV_BASE_URL ?? 'http://nearbystars.local/';
const response = await fetch(baseUrl);
if (!response.ok) throw new Error(`Deployment returned HTTP ${response.status}.`);
const html = await response.text();
if (!html.includes('Content-Security-Policy'))
  throw new Error('Deployment index is missing its Content Security Policy.');
const assetPaths = [...html.matchAll(/(?:src|href)="([^"]*\/assets\/[^"]+)"/g)].map(
  (match) => match[1],
);
if (assetPaths.length < 2)
  throw new Error('Deployment index did not reference built CSS and JavaScript assets.');
for (const assetPath of assetPaths) {
  const assetUrl = new URL(assetPath, baseUrl);
  const assetResponse = await fetch(assetUrl);
  if (!assetResponse.ok) throw new Error(`${assetUrl} returned HTTP ${assetResponse.status}.`);
  const contentType = assetResponse.headers.get('content-type') ?? '';
  if (!/(javascript|css)/.test(contentType))
    throw new Error(`${assetUrl} has unexpected content type ${contentType}.`);
}
console.log(`Verified ${baseUrl} and ${assetPaths.length} production assets.`);
