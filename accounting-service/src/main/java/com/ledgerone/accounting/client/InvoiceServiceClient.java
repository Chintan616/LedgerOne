package com.ledgerone.accounting.client;

import com.ledgerone.accounting.dto.InvoiceDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;

@Component
public class InvoiceServiceClient {

    private static final Logger log = LoggerFactory.getLogger(InvoiceServiceClient.class);

    private final RestTemplate restTemplate;

    @Value("${invoice-service.url}")
    private String invoiceServiceUrl;

    public InvoiceServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public List<InvoiceDto> getInvoices(String userEmail) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-User-Email", userEmail);
            HttpEntity<?> entity = new HttpEntity<>(headers);

            ResponseEntity<List<InvoiceDto>> response = restTemplate.exchange(
                    invoiceServiceUrl + "/api/invoices",
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<List<InvoiceDto>>() {}
            );

            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (Exception e) {
            log.warn("Could not fetch invoices from Invoice Service: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
