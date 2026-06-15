package com.ledgerone.invoice.dto;

import com.ledgerone.invoice.entity.Invoice;
import com.ledgerone.invoice.entity.InvoiceStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record InvoiceResponse(
        Long id,
        String invoiceNumber,
        InvoiceStatus status,
        LocalDate issueDate,
        LocalDate dueDate,
        BigDecimal subtotal,
        BigDecimal gstRate,
        BigDecimal gstAmount,
        BigDecimal totalAmount,
        String notes,
        ClientResponse client,
        List<InvoiceItemResponse> items,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static InvoiceResponse from(Invoice inv) {
        return new InvoiceResponse(
                inv.getId(),
                inv.getInvoiceNumber(),
                inv.getStatus(),
                inv.getIssueDate(),
                inv.getDueDate(),
                inv.getSubtotal(),
                inv.getGstRate(),
                inv.getGstAmount(),
                inv.getTotalAmount(),
                inv.getNotes(),
                ClientResponse.from(inv.getClient()),
                inv.getItems().stream().map(InvoiceItemResponse::from).toList(),
                inv.getCreatedAt(),
                inv.getUpdatedAt()
        );
    }
}
