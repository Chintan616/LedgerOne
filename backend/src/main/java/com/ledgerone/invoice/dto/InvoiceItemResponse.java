package com.ledgerone.invoice.dto;

import com.ledgerone.invoice.entity.InvoiceItem;

import java.math.BigDecimal;

public record InvoiceItemResponse(
        Long id,
        String description,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal amount
) {
    public static InvoiceItemResponse from(InvoiceItem item) {
        return new InvoiceItemResponse(
                item.getId(), item.getDescription(),
                item.getQuantity(), item.getUnitPrice(), item.getAmount()
        );
    }
}
