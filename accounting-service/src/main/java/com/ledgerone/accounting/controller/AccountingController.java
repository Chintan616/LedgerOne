package com.ledgerone.accounting.controller;

import com.ledgerone.accounting.dto.*;
import com.ledgerone.accounting.service.AccountingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<List<ExpenseResponse>> getExpenses(
            @RequestHeader("X-User-Email") String userEmail) {
        return ResponseEntity.ok(accountingService.getExpenses(userEmail));
    }

    @PostMapping("/expenses")
    public ResponseEntity<ExpenseResponse> createExpense(
            @Valid @RequestBody ExpenseRequest request,
            @RequestHeader("X-User-Email") String userEmail) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(accountingService.createExpense(request, userEmail));
    }

    @PutMapping("/expenses/{id}")
    public ResponseEntity<ExpenseResponse> updateExpense(
            @PathVariable Long id,
            @Valid @RequestBody ExpenseRequest request,
            @RequestHeader("X-User-Email") String userEmail) {
        return ResponseEntity.ok(accountingService.updateExpense(id, request, userEmail));
    }

    @DeleteMapping("/expenses/{id}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable Long id,
            @RequestHeader("X-User-Email") String userEmail) {
        accountingService.deleteExpense(id, userEmail);
        return ResponseEntity.noContent().build();
    }

    // ── Reports ───────────────────────────────────────────────────────────────

    @GetMapping("/summary")
    public ResponseEntity<FinancialSummary> getSummary(
            @RequestHeader("X-User-Email") String userEmail) {
        return ResponseEntity.ok(accountingService.getSummary(userEmail));
    }

    @GetMapping("/gst-report")
    public ResponseEntity<GstReport> getGstReport(
            @RequestHeader("X-User-Email") String userEmail,
            @RequestParam(required = false) Integer year) {
        int targetYear = year != null ? year : LocalDate.now().getYear();
        return ResponseEntity.ok(accountingService.getGstReport(userEmail, targetYear));
    }

    @GetMapping("/monthly")
    public ResponseEntity<List<MonthlyData>> getMonthly(
            @RequestHeader("X-User-Email") String userEmail,
            @RequestParam(required = false) Integer year) {
        int targetYear = year != null ? year : LocalDate.now().getYear();
        return ResponseEntity.ok(accountingService.getMonthlyBreakdown(userEmail, targetYear));
    }
}
