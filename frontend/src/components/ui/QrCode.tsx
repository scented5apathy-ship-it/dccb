'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';
import { Spinner } from './Spinner';

export interface QrCodeProps {
  /** Payload encoded into the QR (URL, code, text…). */
  value: string;
  /** Pixel size of the rendered SVG. The SVG itself is scalable; this is the
   * CSS width/height hint. */
  size?: number;
  /** Optional className passthrough so callers can add padding/rings. */
  className?: string;
  /** Optional accessible label for screen readers. Defaults to "QR code". */
  ariaLabel?: string;
}

/**
 * Self-contained QR code renderer.
 *
 * <p>Generates the QR matrix in the browser using the {@code qrcode} npm
 * package — no third-party service, no network round-trip, no caching needed.
 * Output is an inline SVG so it scales crisply to any size and embeds the
 * raw payload (no external image request).</p>
 */
export function QrCode({
  value,
  size = 180,
  className,
  ariaLabel = 'QR code',
}: QrCodeProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setSvg(null);
      return;
    }
    QRCode.toString(value, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 1,
      width: size,
      color: { dark: '#111827', light: '#ffffff' },
    })
      .then((out) => {
        if (!cancelled) setSvg(out);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || 'Lỗi tạo QR');
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (error) {
    return (
      <div
        className={className}
        role="alert"
        style={{ width: size, height: size }}
      >
        <p className="text-xs text-red-600">Không thể tạo QR: {error}</p>
      </div>
    );
  }

  if (!svg) {
    return (
      <div
        className={className}
        style={{ width: size, height: size }}
        aria-label={ariaLabel}
      >
        <div className="flex h-full w-full items-center justify-center">
          <Spinner size="sm" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
      role="img"
      aria-label={ariaLabel}
    />
  );
}

/**
 * Trigger a browser download of the QR as a PNG file. Generates the image
 * locally (via the qrcode library → canvas → toDataURL), so it does not
 * require any backend or third-party service.
 */
export async function downloadQrPng(
  value: string,
  filename: string,
  size = 512
): Promise<void> {
  if (!value) throw new Error('QR value is empty');
  const dataUrl: string = await QRCode.toDataURL(value, {
    width: size,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#111827', light: '#ffffff' },
  });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Capture an arbitrary DOM node as a self-contained PNG and trigger a
 * browser download. Used by the invitation history page to export a fully
 * designed info card (QR + invite code + URL + family name + expiry) in a
 * single image — generated entirely client-side via {@code html-to-image},
 * no backend round-trip required.
 */
export async function downloadNodeAsPng(
  node: HTMLElement,
  filename: string
): Promise<void> {
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
    // Inline external SVG content as well so the exported PNG is fully
    // self-contained (no broken QR if the user is offline).
    skipFonts: false,
    backgroundColor: '#ffffff',
  });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default QrCode;