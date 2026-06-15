package com.ledgerone.invoice.client;

public record SendInvoiceRequest(Long invoiceId, String userEmail) {}
