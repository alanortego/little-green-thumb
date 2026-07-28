import QRCode from 'qrcode';

/**
 * T067: encodes a plant's `qr_code` value as a PNG data URI, embeddable
 * directly in the printable label sheet's <img src>. Uses a data URI (not a
 * saved file) since labels are print-once and regenerated on demand.
 */
export async function generateQrLabelDataUrl(qrCode: string): Promise<string> {
  return QRCode.toDataURL(qrCode, { margin: 1, width: 200 });
}
