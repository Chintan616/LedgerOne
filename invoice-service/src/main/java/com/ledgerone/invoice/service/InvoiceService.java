package com.ledgerone.invoice.service;

import com.ledgerone.invoice.dto.InvoiceItemRequest;
import com.ledgerone.invoice.dto.InvoiceRequest;
import com.ledgerone.invoice.dto.InvoiceResponse;
import com.ledgerone.invoice.dto.StatusUpdateRequest;
import com.ledgerone.invoice.entity.Client;
import com.ledgerone.invoice.entity.Invoice;
import com.ledgerone.invoice.entity.InvoiceItem;
import com.ledgerone.invoice.entity.InvoiceStatus;
import com.ledgerone.invoice.exception.AppException;
import com.ledgerone.invoice.repository.ClientRepository;
import com.ledgerone.invoice.repository.InvoiceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class InvoiceService {

    private static final Logger log = LoggerFactory.getLogger(InvoiceService.class);

    private final InvoiceRepository invoiceRepository;
    private final ClientRepository clientRepository;
    private final com.ledgerone.invoice.client.NotificationServiceClient notificationClient;

    public InvoiceService(InvoiceRepository invoiceRepository, 
                          ClientRepository clientRepository,
                          com.ledgerone.invoice.client.NotificationServiceClient notificationClient) {
        this.invoiceRepository = invoiceRepository;
        this.clientRepository = clientRepository;
        this.notificationClient = notificationClient;
    }

    @Cacheable(value = "invoices", key = "#userEmail")
    public List<InvoiceResponse> getAllInvoices(String userEmail) {
        log.debug("Cache miss — fetching invoices from DB for {}", userEmail);
        return invoiceRepository.findByUserEmailOrderByCreatedAtDesc(userEmail)
                .stream().map(InvoiceResponse::from).toList();
    }

    public InvoiceResponse getInvoice(Long id, String userEmail) {
        Invoice invoice = findOwnedInvoice(id, userEmail);
        return InvoiceResponse.from(invoice);
    }

    @CacheEvict(value = "invoices", key = "#userEmail")
    @Transactional
    public InvoiceResponse createInvoice(InvoiceRequest request, String userEmail) {
        Client client = clientRepository.findByIdAndUserEmail(request.clientId(), userEmail)
                .orElseThrow(() -> new AppException("Client not found", HttpStatus.NOT_FOUND));

        Invoice invoice = new Invoice();
        invoice.setUserEmail(userEmail);
        invoice.setClient(client);
        invoice.setIssueDate(request.issueDate());
        invoice.setDueDate(request.dueDate());
        invoice.setStatus(InvoiceStatus.DRAFT);
        invoice.setNotes(request.notes());

        BigDecimal gstRate = request.gstRate() != null ? request.gstRate() : BigDecimal.valueOf(18);
        invoice.setGstRate(gstRate);

        // Save first to get ID, then assign invoice number
        Invoice saved = invoiceRepository.save(invoice);
        saved.setInvoiceNumber(generateInvoiceNumber(saved.getId()));

        // Build items and calculate totals
        List<InvoiceItem> items = buildItems(request.items(), saved);
        saved.setItems(items);
        calculateTotals(saved);

        Invoice result = invoiceRepository.save(saved);
        log.info("Invoice created: {} for user: {}", result.getInvoiceNumber(), userEmail);
        return InvoiceResponse.from(result);
    }

    @CacheEvict(value = "invoices", key = "#userEmail")
    @Transactional
    public InvoiceResponse updateInvoice(Long id, InvoiceRequest request, String userEmail) {
        Invoice invoice = findOwnedInvoice(id, userEmail);
        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new AppException("Only DRAFT invoices can be edited", HttpStatus.CONFLICT);
        }

        Client client = clientRepository.findByIdAndUserEmail(request.clientId(), userEmail)
                .orElseThrow(() -> new AppException("Client not found", HttpStatus.NOT_FOUND));

        invoice.setClient(client);
        invoice.setIssueDate(request.issueDate());
        invoice.setDueDate(request.dueDate());
        invoice.setNotes(request.notes());

        if (request.gstRate() != null) {
            invoice.setGstRate(request.gstRate());
        }

        invoice.getItems().clear();
        List<InvoiceItem> newItems = buildItems(request.items(), invoice);
        invoice.getItems().addAll(newItems);
        calculateTotals(invoice);

        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    @CacheEvict(value = "invoices", key = "#userEmail")
    @Transactional
    public InvoiceResponse updateStatus(Long id, StatusUpdateRequest request, String userEmail) {
        Invoice invoice = findOwnedInvoice(id, userEmail);
        invoice.setStatus(request.status());
        Invoice updated = invoiceRepository.save(invoice);
        log.info("Invoice {} status changed to {} for user: {}", updated.getInvoiceNumber(), request.status(), userEmail);
        
        if (request.status() == InvoiceStatus.SENT) {
            try {
                notificationClient.sendInvoiceNotification(new com.ledgerone.invoice.client.SendInvoiceRequest(updated.getId(), userEmail));
                log.info("Triggered notification for invoice: {}", updated.getId());
            } catch (Exception e) {
                log.error("Failed to trigger notification for invoice: {}", updated.getId(), e);
            }
        }
        
        return InvoiceResponse.from(updated);
    }

    @CacheEvict(value = "invoices", key = "#userEmail")
    @Transactional
    public void deleteInvoice(Long id, String userEmail) {
        Invoice invoice = findOwnedInvoice(id, userEmail);
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new AppException("Paid invoices cannot be deleted", HttpStatus.CONFLICT);
        }
        invoiceRepository.delete(invoice);
    }

    public Invoice findOwnedInvoiceEntity(Long id, String userEmail) {
        return findOwnedInvoice(id, userEmail);
    }

    // Called by OverdueScheduler
    @Transactional
    public void markOverdueInvoices() {
        List<Invoice> sentInvoices = invoiceRepository.findByStatusAndDueDateBefore(
                InvoiceStatus.SENT, LocalDate.now());
        for (Invoice invoice : sentInvoices) {
            invoice.setStatus(InvoiceStatus.OVERDUE);
            invoiceRepository.save(invoice);
            log.info("Marked invoice {} as OVERDUE", invoice.getInvoiceNumber());
        }
        if (!sentInvoices.isEmpty()) {
            log.info("Marked {} invoices as overdue", sentInvoices.size());
        }
    }

    private Invoice findOwnedInvoice(Long id, String userEmail) {
        return invoiceRepository.findByIdAndUserEmail(id, userEmail)
                .orElseThrow(() -> new AppException("Invoice not found", HttpStatus.NOT_FOUND));
    }

    private String generateInvoiceNumber(Long id) {
        return String.format("INV-%d-%04d", LocalDate.now().getYear(), id);
    }

    private List<InvoiceItem> buildItems(List<InvoiceItemRequest> itemRequests, Invoice invoice) {
        List<InvoiceItem> items = new ArrayList<>();
        for (InvoiceItemRequest req : itemRequests) {
            InvoiceItem item = new InvoiceItem();
            item.setInvoice(invoice);
            item.setDescription(req.description());
            item.setQuantity(req.quantity());
            item.setUnitPrice(req.unitPrice());
            item.setAmount(req.unitPrice().multiply(BigDecimal.valueOf(req.quantity())));
            items.add(item);
        }
        return items;
    }

    private void calculateTotals(Invoice invoice) {
        BigDecimal subtotal = invoice.getItems().stream()
                .map(InvoiceItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal gstAmount = subtotal.multiply(invoice.getGstRate())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        invoice.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        invoice.setGstAmount(gstAmount);
        invoice.setTotalAmount(subtotal.add(gstAmount).setScale(2, RoundingMode.HALF_UP));
    }
}
