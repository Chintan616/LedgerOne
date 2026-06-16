package com.ledgerone.accounting.dto;

import java.math.BigDecimal;

public record FinancialSummary(
        BigDecimal totalRevenue,
        BigDecimal totalExpenses,
        BigDecimal netProfit,
        BigDecimal totalGstCollected,
        BigDecimal totalOutstandingAmount,
        long totalInvoices,
        long paidInvoices,
        long pendingInvoices,
        long overdueInvoices,
        long unpaidInvoices,
        long totalClients,
        long totalExpenseCount
) {}
