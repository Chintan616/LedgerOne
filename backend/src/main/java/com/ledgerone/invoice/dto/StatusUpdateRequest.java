package com.ledgerone.invoice.dto;

import com.ledgerone.invoice.entity.InvoiceStatus;
import jakarta.validation.constraints.NotNull;

public record StatusUpdateRequest(
        @NotNull(message = "Status is required") InvoiceStatus status
) {}
