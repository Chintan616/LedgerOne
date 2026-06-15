package com.ledgerone.invoice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ClientRequest(
        @NotBlank(message = "Name is required") String name,
        String companyName,
        @Email(message = "Invalid email format") String email,
        String phone,
        String address,
        String gstNumber
) {}
