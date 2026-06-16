package com.ledgerone.invoice.dto;

import jakarta.validation.constraints.NotBlank;

public record BusinessProfileRequest(
        @NotBlank(message = "Company name is required") String companyName,
        String address,
        String phone,
        String email,
        String gstNumber,
        String bankName,
        String accountNumber,
        String ifscCode
) {}
