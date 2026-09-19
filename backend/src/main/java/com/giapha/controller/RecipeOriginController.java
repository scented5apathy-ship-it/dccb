package com.giapha.controller;

import com.giapha.model.dto.origin.CreateOriginRequest;
import com.giapha.model.dto.origin.GenealogyTreeResponse;
import com.giapha.model.dto.origin.OriginDto;
import com.giapha.security.CustomUserDetails;
import com.giapha.service.RecipeOriginService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Recipe genealogy endpoints - the novel CâyGiaPhảSố feature.
 * Lets family members record who passed a recipe to whom, then renders the
 * full transmission chain as a nested tree. The Spring Boot app is mounted
 * at context-path=/api, so the class-level mapping starts at root.
 */
@RestController
@RequestMapping("/recipes/{recipeId}")
public class RecipeOriginController {

    private final RecipeOriginService originService;

    public RecipeOriginController(RecipeOriginService originService) {
        this.originService = originService;
    }

    // B6
    @PostMapping("/origins")
    public OriginDto addOrigin(
            @PathVariable UUID recipeId,
            @Valid @RequestBody CreateOriginRequest req,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return originService.addOrigin(recipeId, req, currentUser);
    }

    // B7
    @GetMapping("/origins")
    public List<OriginDto> listOrigins(
            @PathVariable UUID recipeId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return originService.listOrigins(recipeId, currentUser);
    }

    // B8
    @GetMapping("/genealogy-tree")
    public GenealogyTreeResponse getGenealogyTree(
            @PathVariable UUID recipeId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return originService.buildGenealogyTree(recipeId, currentUser);
    }
}