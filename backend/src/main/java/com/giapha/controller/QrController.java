package com.giapha.controller;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Map;

/**
 * Self-contained QR code generation. Zero external dependencies — uses ZXing
 * (already on the classpath via the {@code com.google.zxing:core} jar) to
 * produce PNG bytes that the frontend (or external tools) can download.
 *
 * <p>The frontend also generates QR codes locally with the {@code qrcode} npm
 * package for inline SVG rendering. This endpoint exists for:
 * <ul>
 *   <li>Download as PNG (attach to email, save to disk).</li>
 *   <li>Server-side use (e.g. embedding in a PDF invitation later).</li>
 *   <li>Fallback when the client-side library fails.</li>
 * </ul>
 *
 * <p>This endpoint requires a valid JWT (same as every other non-auth route)
 * — callers must be logged in. The payload (URL) is non-secret, but we keep
 * the auth requirement so QR generation can't be triggered anonymously from
 * a third-party site.</p>
 */
@RestController
@RequestMapping("/qr")
public class QrController {

    /**
     * Hard cap on width/height (pixels). Larger images get downsized.
     */
    private static final int MAX_SIZE = 1024;
    private static final int MIN_SIZE = 64;
    private static final int DEFAULT_SIZE = 320;

    @GetMapping(produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> generate(
            @RequestParam("data") String data,
            @RequestParam(value = "size", required = false) Integer size
    ) {
        int pixels = size == null ? DEFAULT_SIZE : Math.max(MIN_SIZE, Math.min(size, MAX_SIZE));
        if (data == null || data.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            QRCodeWriter writer = new QRCodeWriter();
            Map<EncodeHintType, Object> hints = Map.of(
                    EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M,
                    EncodeHintType.MARGIN, 1,
                    EncodeHintType.CHARACTER_SET, "UTF-8"
            );
            BitMatrix matrix = writer.encode(data, BarcodeFormat.QR_CODE, pixels, pixels, hints);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);
            byte[] png = out.toByteArray();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setContentLength(png.length);
            headers.setCacheControl("public, max-age=86400");
            return new ResponseEntity<>(png, headers, org.springframework.http.HttpStatus.OK);
        } catch (WriterException | IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}