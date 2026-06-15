package com.ledgerone.notification.client;

import com.ledgerone.notification.dto.InvoiceDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "invoice-service")
public interface InvoiceServiceClient {

    @GetMapping("/api/invoices/{id}")
    InvoiceDto getInvoice(@PathVariable("id") Long id, @RequestHeader("X-User-Email") String userEmail);

    @GetMapping("/api/invoices/{id}/pdf")
    byte[] downloadPdf(@PathVariable("id") Long id, @RequestHeader("X-User-Email") String userEmail);
}
