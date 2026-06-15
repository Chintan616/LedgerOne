package com.ledgerone.notification.dto;

public record SendInvoiceRequest(
        Long invoiceId,
        String userEmail
) {}
