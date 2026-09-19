package com.giapha.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFound(
            ResourceNotFoundException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(
            BadRequestException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthorized(
            UnauthorizedException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.UNAUTHORIZED, ex.getMessage(), request);
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApiException(
            ApiException ex, HttpServletRequest request) {
        ResponseEntity<Map<String, Object>> response = buildResponse(ex.getStatus(), ex.getMessage(), request);
        if (ex instanceof TimeCapsuleLockedException) {
            response.getBody().put("daysUntilUnlock", ((TimeCapsuleLockedException) ex).getDaysUntilUnlock());
        }
        return response;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        Map<String, Object> body = baseBody(HttpStatus.BAD_REQUEST, "Validation failed", request);
        body.put("errors", fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleAuthentication(
            AuthenticationException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.UNAUTHORIZED, ex.getMessage(), request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.FORBIDDEN, ex.getMessage(), request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(
            IllegalArgumentException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(
            DataIntegrityViolationException ex, HttpServletRequest request) {
        // Convert DB-level constraint failures (CHECK / FK / UNIQUE) into
        // 400 with a readable message instead of 500. Common cases:
        //   - events.end_date < event_date
        //   - members.fk_violation
        //   - unique violations
        String msg = ex.getMostSpecificCause() != null
            ? ex.getMostSpecificCause().getMessage()
            : ex.getMessage();
        String friendly = "Dữ liệu không hợp lệ";
        if (msg != null) {
            if (msg.contains("events_check")) {
                friendly = "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu";
            } else if (msg.contains("events_event_type_check")) {
                friendly = "Loại sự kiện không hợp lệ. Vui lòng chọn một trong: Đám cưới, Tang lễ, Sinh nhật, Đoàn tụ, Kỷ niệm, Lễ hội / Tôn giáo, Khác.";
            } else if (msg.contains("chat_msg_content_or_attachment")) {
                friendly = "Tin nhắn TEXT phải có nội dung; IMAGE/FILE phải có URL đính kèm";
            } else if (msg.contains("duplicate key")) {
                friendly = "Bản ghi đã tồn tại";
            } else if (msg.contains("violates foreign key")) {
                friendly = "Tham chiếu không hợp lệ";
            }
        }
        log.warn("DataIntegrityViolation at {} {}: {}", request.getMethod(),
            request.getRequestURI(), msg);
        return buildResponse(HttpStatus.BAD_REQUEST, friendly, request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleNotReadable(
            HttpMessageNotReadableException ex, HttpServletRequest request) {
        // Triggered by malformed JSON, wrong field types, or a missing body
        // when one is required. Convert to 400 instead of 500 so the frontend
        // can surface the actual cause.
        Throwable root = ex.getMostSpecificCause();
        String detail = root != null ? root.getMessage() : ex.getMessage();
        log.warn("Malformed request body at {} {}: {}", request.getMethod(),
            request.getRequestURI(), detail);
        return buildResponse(HttpStatus.BAD_REQUEST,
            "Request body không hợp lệ: " + (detail == null ? "thiếu dữ liệu" : detail),
            request);
    }

    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMethodNotSupported(
            org.springframework.web.HttpRequestMethodNotSupportedException ex,
            HttpServletRequest request) {
        // Triggered when the client uses a verb (GET/POST/...) that no
        // controller method accepts on this path. Return 405 with a
        // human-readable hint so the frontend can show it instead of a 500.
        String supported = String.join(", ", ex.getSupportedMethods() != null
            ? java.util.List.of(ex.getSupportedMethods())
            : java.util.List.of());
        log.warn("Method not allowed at {} {} (supported={})",
            request.getMethod(), request.getRequestURI(), supported);
        String msg = "Phương thức " + request.getMethod()
            + " không được hỗ trợ cho endpoint này"
            + (supported.isEmpty() ? "" : " (chỉ hỗ trợ: " + supported + ")");
        return buildResponse(HttpStatus.METHOD_NOT_ALLOWED, msg, request);
    }

    @ExceptionHandler(org.springframework.web.servlet.NoHandlerFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(
            org.springframework.web.servlet.NoHandlerFoundException ex,
            HttpServletRequest request) {
        log.warn("No handler for {} {}", request.getMethod(), request.getRequestURI());
        return buildResponse(HttpStatus.NOT_FOUND,
            "Không tìm thấy endpoint " + request.getRequestURI(), request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(
            Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception at {} {}", request.getMethod(), request.getRequestURI(), ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred", request);
    }

    private ResponseEntity<Map<String, Object>> buildResponse(
            HttpStatus status, String message, HttpServletRequest request) {
        return ResponseEntity.status(status)
            .body(baseBody(status, message, request));
    }

    private Map<String, Object> baseBody(HttpStatus status, String message, HttpServletRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        body.put("path", request.getRequestURI());
        return body;
    }
}
