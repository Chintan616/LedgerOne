package com.ledgerone.invoice.controller;

import com.ledgerone.invoice.dto.BusinessProfileRequest;
import com.ledgerone.invoice.dto.BusinessProfileResponse;
import com.ledgerone.invoice.service.BusinessProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class BusinessProfileController {

    private final BusinessProfileService service;

    public BusinessProfileController(BusinessProfileService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<BusinessProfileResponse> getProfile(Authentication authentication) {
        BusinessProfileResponse response = service.getProfile(authentication.getName());
        if (response == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<BusinessProfileResponse> updateProfile(
            @Valid @RequestBody BusinessProfileRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(service.updateProfile(request, authentication.getName()));
    }
}
