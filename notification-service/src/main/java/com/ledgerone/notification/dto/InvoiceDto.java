package com.ledgerone.notification.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InvoiceDto(
        Long id,
        String invoiceNumber,
        String status,
        LocalDate issueDate,
        LocalDate dueDate,
        BigDecimal totalAmount,
        ClientDto client
) {}
