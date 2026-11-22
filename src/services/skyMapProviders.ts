export type SkyMapProvider = 'esa-sky' | 'aladin' | 'nasa-skyview' | 'wwt';

export const DEFAULT_SKY_MAP_PROVIDER: SkyMapProvider = 'esa-sky';

export const SKY_MAP_PROVIDERS: ReadonlyArray<Readonly<{ id: SkyMapProvider; label: string }>> = [
  { id: 'esa-sky', label: 'ESA Sky' },
  { id: 'aladin', label: 'Aladin Lite' },
  { id: 'nasa-skyview', label: 'NASA SkyView' },
  { id: 'wwt', label: 'WorldWide Telescope' },
];

export function isSkyMapProvider(value: unknown): value is SkyMapProvider {
  return SKY_MAP_PROVIDERS.some((provider) => provider.id === value);
}

export function getSkyMapUrl(
  provider: SkyMapProvider,
  raDeg: number,
  decDeg: number,
  objectName: string,
): string {
  switch (provider) {
    case 'esa-sky': {
      const parameters = new URLSearchParams({
        target: `${raDeg} ${decDeg}`,
        fov: '0.5',
        cooframe: 'J2000',
        sci: 'true',
      });
      return `https://sky.esa.int/esasky/?${parameters.toString()}`;
    }
    case 'aladin': {
      const parameters = new URLSearchParams({
        target: `${raDeg} ${decDeg}`,
        fov: '0.5',
        survey: 'P/DSS2/color',
      });
      return `https://aladin.cds.unistra.fr/AladinLite/?${parameters.toString()}`;
    }
    case 'nasa-skyview': {
      const parameters = new URLSearchParams({
        Position: `${raDeg},${decDeg}`,
        Survey: 'DSS2 Red',
        Coordinates: 'J2000',
        Size: '0.5',
        Pixels: '600',
        Return: 'JPEG',
      });
      return `https://skyview.gsfc.nasa.gov/cgi-bin/images?${parameters.toString()}`;
    }
    case 'wwt': {
      const parameters = new URLSearchParams({
        object: objectName,
        ra: String(raDeg / 15),
        dec: String(decDeg),
        zoom: '3',
      });
      return `https://www.worldwidetelescope.org/wwtweb/goto.aspx?${parameters.toString()}`;
    }
  }
}
