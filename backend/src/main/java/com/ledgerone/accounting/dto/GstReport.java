package com.ledgerone.accounting.dto;

import java.math.BigDecimal;

public record GstReport(
        int year,
        BigDecimal totalTaxableAmount,
        BigDecimal totalGstCollected,
        long paidInvoiceCount
) {}
