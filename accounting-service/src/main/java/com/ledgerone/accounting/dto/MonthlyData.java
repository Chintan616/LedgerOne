package com.ledgerone.accounting.dto;

import java.math.BigDecimal;

public record MonthlyData(
        int year,
        int month,
        String monthName,
        BigDecimal revenue,
        BigDecimal expenses,
        BigDecimal profit
) {}
