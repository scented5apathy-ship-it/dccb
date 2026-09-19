package com.giapha.config;

import org.springframework.context.annotation.Configuration;

/**
 * CORS configuration is delegated to {@link SecurityConfig#corsConfigurationSource()}.
 * This class exists so that cross-cutting CORS concerns (custom origins, additional
 * allowlists for production, etc.) can be wired here in the future without changing
 * the security filter chain.
 */
@Configuration
public class CorsConfig {
}
