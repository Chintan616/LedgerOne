package com.ledgerone.invoice.controller;

import com.ledgerone.invoice.dto.InvoiceRequest;
import com.ledgerone.invoice.dto.InvoiceResponse;
import com.ledgerone.invoice.dto.StatusUpdateRequest;
import com.ledgerone.invoice.entity.Invoice;
import com.ledgerone.invoice.service.InvoiceService;
import com.ledgerone.invoice.service.PdfService;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final PdfService pdfService;

    public InvoiceController(InvoiceService invoiceService, PdfService pdfService) {
        this.invoiceService = invoiceService;
        this.pdfService = pdfService;
    }

    @GetMapping
    public ResponseEntity<List<InvoiceResponse>> getAll(
            @RequestHeader("X-User-Email") String userEmail) {
        return ResponseEntity.ok(invoiceService.getAllInvoices(userEmail));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> getOne(
            @PathVariable Long id,
            @RequestHeader("X-User-Email") String userEmail) {
        return ResponseEntity.ok(invoiceService.getInvoice(id, userEmail));
    }

    @PostMapping
    public ResponseEntity<InvoiceResponse> create(
            @Valid @RequestBody InvoiceRequest request,
            @RequestHeader("X-User-Email") String userEmail) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(invoiceService.createInvoice(request, userEmail));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InvoiceResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody InvoiceRequest request,
            @RequestHeader("X-User-Email") String userEmail) {
        return ResponseEntity.ok(invoiceService.updateInvoice(id, request, userEmail));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<InvoiceResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request,
            @RequestHeader("X-User-Email") String userEmail) {
        return ResponseEntity.ok(invoiceService.updateStatus(id, request, userEmail));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestHeader("X-User-Email") String userEmail) {
        invoiceService.deleteInvoice(id, userEmail);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(
            @PathVariable Long id,
            @RequestHeader("X-User-Email") String userEmail) throws IOException {
        Invoice invoice = invoiceService.findOwnedInvoiceEntity(id, userEmail);
        byte[] pdf = pdfService.generateInvoicePdf(invoice);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(invoice.getInvoiceNumber() + ".pdf")
                .build());

        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }
}
