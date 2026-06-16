package com.ledgerone.accounting.dto;

import com.ledgerone.accounting.entity.ExpenseCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseRequest(
        @NotNull(message = "Category is required") ExpenseCategory category,
        @NotBlank(message = "Description is required") String description,
        @NotNull @Positive(message = "Amount must be positive") BigDecimal amount,
        @NotNull(message = "Date is required") LocalDate date
) {}
