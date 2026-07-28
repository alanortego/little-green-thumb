import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../src/services/api';

const apiMock = vi.hoisted(() => vi.fn());
const getCachedPlantsMock = vi.hoisted(() => vi.fn());

vi.mock('../../src/services/api', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/api')>('../../src/services/api');
  return { ...actual, api: apiMock };
});
vi.mock('../../src/services/offlineCache', () => ({ getCachedPlants: getCachedPlantsMock }));

// Import after mocks are registered so resolveQrCode picks up the mocked api/getCachedPlants.
const { resolveQrCode } = await import('../../src/services/qrResolve');

/** T075: QR offline-resolution fallback (FR-020, Edge Cases). */
describe('resolveQrCode', () => {
  beforeEach(() => {
    apiMock.mockReset();
    getCachedPlantsMock.mockReset();
  });

  it('returns the server result when the network is reachable', async () => {
    const plant = { id: 1, name: 'Carrot', qr_code: 'QR-1', image_path: null, benefit_text: 'Good for eyes' };
    apiMock.mockResolvedValueOnce(plant);

    await expect(resolveQrCode('QR-1')).resolves.toEqual(plant);
    expect(getCachedPlantsMock).not.toHaveBeenCalled();
  });

  it('re-throws an ApiError (server reached, code genuinely unrecognized) without falling back to cache', async () => {
    apiMock.mockRejectedValueOnce(new ApiError(404, { error: 'qr_code_not_recognized' }));

    await expect(resolveQrCode('QR-unknown')).rejects.toBeInstanceOf(ApiError);
    expect(getCachedPlantsMock).not.toHaveBeenCalled();
  });

  it('falls back to the cached plant list when the network is unavailable', async () => {
    apiMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    getCachedPlantsMock.mockResolvedValueOnce([
      { id: 2, name: 'Pea', qr_code: 'QR-2', image_path: null, benefit_text: 'Protein power' },
    ]);

    await expect(resolveQrCode('QR-2')).resolves.toEqual({
      id: 2,
      name: 'Pea',
      qr_code: 'QR-2',
      benefit_text: 'Protein power',
      image_path: null,
    });
  });

  it('throws when offline and the code is not in the cached plant list', async () => {
    apiMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    getCachedPlantsMock.mockResolvedValueOnce([]);

    await expect(resolveQrCode('QR-missing')).rejects.toThrow('qr_code_not_recognized_offline');
  });
});
