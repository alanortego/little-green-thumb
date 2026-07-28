import { ApiError, api } from './api';
import { getCachedPlants } from './offlineCache';

export interface ScannedPlant {
  id: number;
  name: string;
  qr_code: string;
  image_path: string | null;
  benefit_text: string | null;
}

/**
 * Resolves a scanned QR code to a Plant. Tries the network first (also
 * records the plant_discoveries row server-side); if the network is
 * unavailable, falls back to matching against the last cached `/plants`
 * list so scanning still works offline in the garden (FR-020, Edge Cases).
 */
export async function resolveQrCode(qrCode: string): Promise<ScannedPlant> {
  try {
    return await api<ScannedPlant>(`/plants/by-qr/${encodeURIComponent(qrCode)}`);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error; 
    } // Server reached, code genuinely not recognized
    const cached = await getCachedPlants();
    const match = cached.find((p) => p.qr_code === qrCode);
    if (!match) {
      throw new Error('qr_code_not_recognized_offline'); 
    }
    return match;
  }
}
