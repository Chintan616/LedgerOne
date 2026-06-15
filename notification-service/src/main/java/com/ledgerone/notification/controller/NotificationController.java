package com.ledgerone.notification.controller;

import com.ledgerone.notification.dto.SendInvoiceRequest;
import com.ledgerone.notification.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping("/send-invoice")
    public ResponseEntity<Void> sendInvoice(@RequestBody SendInvoiceRequest request) {
        // Hand off to @Async method and return immediately
        notificationService.processInvoiceNotification(request);
        return ResponseEntity.accepted().build();
    }
}
