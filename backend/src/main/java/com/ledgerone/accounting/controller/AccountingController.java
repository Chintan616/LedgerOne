package com.ledgerone.accounting.controller;

import com.ledgerone.accounting.dto.*;
import com.ledgerone.accounting.service.AccountingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/accounting")
public class AccountingController {

    private final AccountingService accountingService;

    public AccountingController(AccountingService accountingService) {
        this.accountingService = accountingService;
    }

    // ── Expenses ──────────────────────────────────────────────────────────────

    @GetMapping("/expenses")
    public ResponseEntity<List<ExpenseResponse>> getExpenses(Authentication authentication) {
        return ResponseEntity.ok(accountingService.getExpenses(authentication.getName()));
    }

    @PostMapping("/expenses")
    public ResponseEntity<ExpenseResponse> createExpense(
            @Valid @RequestBody ExpenseRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(accountingService.createExpense(request, authentication.getName()));
    }

    @PutMapping("/expenses/{id}")
    public ResponseEntity<ExpenseResponse> updateExpense(
            @PathVariable Long id,
            @Valid @RequestBody ExpenseRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(accountingService.updateExpense(id, request, authentication.getName()));
    }

    @DeleteMapping("/expenses/{id}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable Long id,
            Authentication authentication) {
        accountingService.deleteExpense(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    // ── Reports ───────────────────────────────────────────────────────────────

    @GetMapping("/summary")
    public ResponseEntity<FinancialSummary> getSummary(Authentication authentication) {
        return ResponseEntity.ok(accountingService.getSummary(authentication.getName()));
    }

    @GetMapping("/gst-report")
    public ResponseEntity<GstReport> getGstReport(
            Authentication authentication,
            @RequestParam(required = false) Integer year) {
        int targetYear = year != null ? year : LocalDate.now().getYear();
        return ResponseEntity.ok(accountingService.getGstReport(authentication.getName(), targetYear));
    }

    @GetMapping("/monthly")
    public ResponseEntity<List<MonthlyData>> getMonthly(
            Authentication authentication,
            @RequestParam(required = false) Integer year) {
        int targetYear = year != null ? year : LocalDate.now().getYear();
        return ResponseEntity.ok(accountingService.getMonthlyBreakdown(authentication.getName(), targetYear));
    }
}
