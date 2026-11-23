import { describe, expect, it } from 'vitest';
import { formatCoordinates } from '../../src/services/coordinateFormats';

describe('coordinate formats', () => {
  it('formats decimal degrees for display and high-precision copying', () => {
    expect(formatCoordinates(219.92040813, -60.83514522, 'decimal-degrees')).toEqual({
      ra: '219.92041°',
      dec: '-60.83515°',
      copy: '219.92040813, -60.83514522',
    });
  });

  it('formats unit-labeled and colon-separated sexagesimal coordinates', () => {
    expect(formatCoordinates(219.92040813, -60.83514522, 'hms-dms').copy).toBe(
      '14h 39m 40.90s, -60d 50m 06.52s',
    );
    expect(formatCoordinates(219.92040813, -60.83514522, 'sexagesimal-colon').copy).toBe(
      '14:39:40.90, -60:50:06.52',
    );
  });
});
