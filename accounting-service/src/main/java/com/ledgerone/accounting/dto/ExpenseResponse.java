package com.ledgerone.accounting.dto;

import com.ledgerone.accounting.entity.Expense;
import com.ledgerone.accounting.entity.ExpenseCategory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ExpenseResponse(
        Long id,
        ExpenseCategory category,
        String description,
        BigDecimal amount,
        LocalDate date,
        LocalDateTime createdAt
) {
    public static ExpenseResponse from(Expense e) {
        return new ExpenseResponse(
                e.getId(), e.getCategory(), e.getDescription(),
                e.getAmount(), e.getDate(), e.getCreatedAt()
        );
    }
}
