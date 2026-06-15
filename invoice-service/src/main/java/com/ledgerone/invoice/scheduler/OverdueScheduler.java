package com.ledgerone.invoice.scheduler;

import com.ledgerone.invoice.service.InvoiceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class OverdueScheduler {

    private static final Logger log = LoggerFactory.getLogger(OverdueScheduler.class);

    private final InvoiceService invoiceService;

    public OverdueScheduler(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    // Runs every day at midnight
    @Scheduled(cron = "0 0 0 * * *")
    public void detectOverdueInvoices() {
        log.info("Running overdue invoice detection...");
        invoiceService.markOverdueInvoices();
    }
}
