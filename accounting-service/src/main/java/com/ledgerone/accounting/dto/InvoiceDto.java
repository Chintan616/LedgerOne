package com.ledgerone.accounting.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.LocalDate;

@JsonIgnoreProperties(ignoreUnknown = true)
public record InvoiceDto(
        Long id,
        String invoiceNumber,
        String status,
        LocalDate issueDate,
        LocalDate dueDate,
        BigDecimal subtotal,
        BigDecimal gstRate,
        BigDecimal gstAmount,
        BigDecimal totalAmount,
        InvoiceClientDto client
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record InvoiceClientDto(Long id, String name, String companyName) {}
}
