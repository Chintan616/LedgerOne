package com.ledgerone.invoice.controller;

import com.ledgerone.invoice.dto.InvoiceRequest;
import com.ledgerone.invoice.dto.InvoiceResponse;
import com.ledgerone.invoice.dto.StatusUpdateRequest;
import com.ledgerone.invoice.entity.Invoice;
import com.ledgerone.invoice.entity.BusinessProfile;
import com.ledgerone.invoice.service.BusinessProfileService;
import com.ledgerone.invoice.service.InvoiceService;
import com.ledgerone.invoice.service.PdfService;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final PdfService pdfService;
    private final BusinessProfileService businessProfileService;

    public InvoiceController(InvoiceService invoiceService, PdfService pdfService, BusinessProfileService businessProfileService) {
        this.invoiceService = invoiceService;
        this.pdfService = pdfService;
        this.businessProfileService = businessProfileService;
    }

    @GetMapping
    public ResponseEntity<List<InvoiceResponse>> getAll(Authentication authentication) {
        return ResponseEntity.ok(invoiceService.getAllInvoices(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> getOne(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(invoiceService.getInvoice(id, authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<InvoiceResponse> create(
            @Valid @RequestBody InvoiceRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(invoiceService.createInvoice(request, authentication.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InvoiceResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody InvoiceRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(invoiceService.updateInvoice(id, request, authentication.getName()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<InvoiceResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(invoiceService.updateStatus(id, request, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            Authentication authentication) {
        invoiceService.deleteInvoice(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(
            @PathVariable Long id,
            Authentication authentication) throws IOException {
        String userEmail = authentication.getName();
        Invoice invoice = invoiceService.findOwnedInvoiceEntity(id, userEmail);
        BusinessProfile profile = businessProfileService.getProfileEntity(userEmail);
        byte[] pdf = pdfService.generateInvoicePdf(invoice, profile);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(invoice.getInvoiceNumber() + ".pdf")
                .build());

        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }
}
