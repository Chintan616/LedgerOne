package com.ledgerone.invoice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record InvoiceItemRequest(
        @NotBlank(message = "Description is required") String description,
        @Min(value = 1, message = "Quantity must be at least 1") int quantity,
        @NotNull @Positive(message = "Unit price must be positive") BigDecimal unitPrice
) {}
