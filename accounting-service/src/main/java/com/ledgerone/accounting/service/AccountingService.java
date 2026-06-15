package com.ledgerone.accounting.service;

import com.ledgerone.accounting.client.InvoiceServiceClient;
import com.ledgerone.accounting.dto.*;
import com.ledgerone.accounting.entity.Expense;
import com.ledgerone.accounting.exception.AppException;
import com.ledgerone.accounting.repository.ExpenseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AccountingService {

    private static final Logger log = LoggerFactory.getLogger(AccountingService.class);

    private final ExpenseRepository expenseRepository;
    private final InvoiceServiceClient invoiceServiceClient;

    public AccountingService(ExpenseRepository expenseRepository,
                             InvoiceServiceClient invoiceServiceClient) {
        this.expenseRepository = expenseRepository;
        this.invoiceServiceClient = invoiceServiceClient;
    }

    // ── Expenses ─────────────────────────────────────────────────────────────

    @Cacheable(value = "expenses", key = "#userEmail")
    public List<ExpenseResponse> getExpenses(String userEmail) {
        log.debug("Cache miss — fetching expenses from DB for {}", userEmail);
        return expenseRepository.findByUserEmailOrderByDateDesc(userEmail)
                .stream().map(ExpenseResponse::from).toList();
    }

    @Caching(evict = {
            @CacheEvict(value = "expenses", key = "#userEmail"),
            @CacheEvict(value = "gst",      allEntries = true),
            @CacheEvict(value = "monthly",  allEntries = true)
    })
    public ExpenseResponse createExpense(ExpenseRequest request, String userEmail) {
        Expense expense = new Expense();
        expense.setUserEmail(userEmail);
        mapRequest(request, expense);
        return ExpenseResponse.from(expenseRepository.save(expense));
    }

    @Caching(evict = {
            @CacheEvict(value = "expenses", key = "#userEmail"),
            @CacheEvict(value = "summary",  key = "#userEmail"),
            @CacheEvict(value = "gst",      allEntries = true),
            @CacheEvict(value = "monthly",  allEntries = true)
    })
    public ExpenseResponse updateExpense(Long id, ExpenseRequest request, String userEmail) {
        Expense expense = findOwned(id, userEmail);
        mapRequest(request, expense);
        return ExpenseResponse.from(expenseRepository.save(expense));
    }

    @Caching(evict = {
            @CacheEvict(value = "expenses", key = "#userEmail"),
            @CacheEvict(value = "summary",  key = "#userEmail"),
            @CacheEvict(value = "gst",      allEntries = true),
            @CacheEvict(value = "monthly",  allEntries = true)
    })
    public void deleteExpense(Long id, String userEmail) {
        expenseRepository.delete(findOwned(id, userEmail));
    }

    // ── Financial Summary ─────────────────────────────────────────────────────

    public FinancialSummary getSummary(String userEmail) {
        log.debug("Cache miss — computing financial summary for {}", userEmail);

        List<InvoiceDto> invoices = invoiceServiceClient.getInvoices(userEmail);
        List<Expense> expenses = expenseRepository.findByUserEmailOrderByDateDesc(userEmail);

        BigDecimal revenue = sumField(invoices, "PAID", InvoiceDto::totalAmount);
        BigDecimal gstCollected = sumField(invoices, "PAID", InvoiceDto::gstAmount);
        BigDecimal totalExpenses = expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal outstandingSent = sumField(invoices, "SENT", InvoiceDto::totalAmount);
        BigDecimal outstandingOverdue = sumField(invoices, "OVERDUE", InvoiceDto::totalAmount);
        BigDecimal totalOutstandingAmount = outstandingSent.add(outstandingOverdue);

        long paid    = invoices.stream().filter(i -> "PAID".equals(i.status())).count();
        long pending = invoices.stream().filter(i -> "SENT".equals(i.status())).count();
        long overdue = invoices.stream().filter(i -> "OVERDUE".equals(i.status())).count();
        long unpaidInvoices = pending + overdue;
        long clients = invoices.stream()
                .filter(i -> i.client() != null)
                .map(i -> i.client().id())
                .distinct().count();

        return new FinancialSummary(
                revenue, totalExpenses, revenue.subtract(totalExpenses),
                gstCollected, totalOutstandingAmount, invoices.size(), paid, pending, overdue,
                unpaidInvoices, clients, expenses.size()
        );
    }

    // ── GST Report ────────────────────────────────────────────────────────────

    @Cacheable(value = "gst", key = "#userEmail + '_' + #year")
    public GstReport getGstReport(String userEmail, int year) {
        log.debug("Cache miss — computing GST report for {} year {}", userEmail, year);

        List<InvoiceDto> invoices = invoiceServiceClient.getInvoices(userEmail);

        List<InvoiceDto> paidThisYear = invoices.stream()
                .filter(i -> "PAID".equals(i.status()))
                .filter(i -> i.issueDate() != null && i.issueDate().getYear() == year)
                .toList();

        BigDecimal taxable = paidThisYear.stream()
                .map(i -> i.subtotal() != null ? i.subtotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal gst = paidThisYear.stream()
                .map(i -> i.gstAmount() != null ? i.gstAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new GstReport(year, taxable, gst, paidThisYear.size());
    }

    // ── Monthly Breakdown ─────────────────────────────────────────────────────

    @Cacheable(value = "monthly", key = "#userEmail + '_' + #year")
    public List<MonthlyData> getMonthlyBreakdown(String userEmail, int year) {
        log.debug("Cache miss — computing monthly breakdown for {} year {}", userEmail, year);

        List<InvoiceDto> invoices = invoiceServiceClient.getInvoices(userEmail);
        LocalDate from = LocalDate.of(year, 1, 1);
        LocalDate to   = LocalDate.of(year, 12, 31);
        List<Expense> expenses = expenseRepository
                .findByUserEmailAndDateBetweenOrderByDateDesc(userEmail, from, to);

        // Revenue per month (PAID invoices)
        Map<Integer, BigDecimal> revenueByMonth = invoices.stream()
                .filter(i -> "PAID".equals(i.status()))
                .filter(i -> i.issueDate() != null && i.issueDate().getYear() == year)
                .collect(Collectors.groupingBy(
                        i -> i.issueDate().getMonthValue(),
                        Collectors.reducing(BigDecimal.ZERO, InvoiceDto::totalAmount, BigDecimal::add)
                ));

        // Expenses per month
        Map<Integer, BigDecimal> expenseByMonth = expenses.stream()
                .filter(e -> e.getDate().getYear() == year)
                .collect(Collectors.groupingBy(
                        e -> e.getDate().getMonthValue(),
                        Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)
                ));

        List<MonthlyData> result = new ArrayList<>();
        for (int m = 1; m <= 12; m++) {
            BigDecimal rev = revenueByMonth.getOrDefault(m, BigDecimal.ZERO);
            BigDecimal exp = expenseByMonth.getOrDefault(m, BigDecimal.ZERO);
            result.add(new MonthlyData(year, m, Month.of(m).name(), rev, exp, rev.subtract(exp)));
        }
        return result;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Expense findOwned(Long id, String userEmail) {
        return expenseRepository.findByIdAndUserEmail(id, userEmail)
                .orElseThrow(() -> new AppException("Expense not found", HttpStatus.NOT_FOUND));
    }

    private void mapRequest(ExpenseRequest req, Expense expense) {
        expense.setCategory(req.category());
        expense.setDescription(req.description());
        expense.setAmount(req.amount());
        expense.setDate(req.date());
    }

    private BigDecimal sumField(List<InvoiceDto> invoices, String status,
                                java.util.function.Function<InvoiceDto, BigDecimal> getter) {
        return invoices.stream()
                .filter(i -> status.equals(i.status()))
                .map(i -> getter.apply(i) != null ? getter.apply(i) : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
