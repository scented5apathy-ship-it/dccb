package com.giapha.util;

import java.util.UUID;

public final class StringUtil {

    private StringUtil() {
        // Utility class
    }

    public static boolean isNullOrBlank(String value) {
        return value == null || value.isBlank();
    }

    public static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    public static String defaultIfBlank(String value, String fallback) {
        return hasText(value) ? value : fallback;
    }

    public static String generateUuid() {
        return UUID.randomUUID().toString();
    }

    public static String slugify(String input) {
        if (isNullOrBlank(input)) {
            return "";
        }
        String normalized = java.text.Normalizer.normalize(input, java.text.Normalizer.Form.NFD)
            .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return normalized.toLowerCase()
            .replaceAll("[^a-z0-9\\s-]", "")
            .replaceAll("\\s+", "-")
            .replaceAll("-+", "-")
            .replaceAll("^-|-$", "");
    }

    public static String maskEmail(String email) {
        if (isNullOrBlank(email) || !email.contains("@")) {
            return "***";
        }
        String[] parts = email.split("@", 2);
        String local = parts[0];
        if (local.length() <= 2) {
            return "**@" + parts[1];
        }
        return local.charAt(0) + "***" + local.charAt(local.length() - 1) + "@" + parts[1];
    }
}
