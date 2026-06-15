package com.ledgerone.invoice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record InvoiceRequest(
        @NotNull(message = "Client is required") Long clientId,
        @NotNull(message = "Issue date is required") LocalDate issueDate,
        @NotNull(message = "Due date is required") LocalDate dueDate,
        @NotEmpty(message = "At least one item is required") @Valid List<InvoiceItemRequest> items,
        BigDecimal gstRate,
        String notes
) {}
