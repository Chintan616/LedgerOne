package com.ledgerone.notification.service;

import com.ledgerone.notification.client.InvoiceServiceClient;
import com.ledgerone.notification.dto.InvoiceDto;
import com.ledgerone.notification.dto.SendInvoiceRequest;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final JavaMailSender mailSender;
    private final InvoiceServiceClient invoiceServiceClient;

    public NotificationService(JavaMailSender mailSender, InvoiceServiceClient invoiceServiceClient) {
        this.mailSender = mailSender;
        this.invoiceServiceClient = invoiceServiceClient;
    }

    @Async
    public void processInvoiceNotification(SendInvoiceRequest request) {
        log.info("Processing async notification for invoice ID: {}", request.invoiceId());

        try {
            // 1. Fetch Invoice Details
            InvoiceDto invoice = invoiceServiceClient.getInvoice(request.invoiceId(), request.userEmail());
            
            if (invoice.client() == null || invoice.client().email() == null || invoice.client().email().isBlank()) {
                log.error("Cannot send email: Client email is missing for invoice ID: {}", request.invoiceId());
                return;
            }

            // 2. Fetch PDF
            byte[] pdfBytes = invoiceServiceClient.downloadPdf(request.invoiceId(), request.userEmail());

            // 3. Send Email
            sendEmailWithAttachment(invoice, pdfBytes);
            
            log.info("Successfully sent email for invoice: {}", invoice.invoiceNumber());

        } catch (Exception e) {
            log.error("Failed to process invoice notification for ID: {}", request.invoiceId(), e);
        }
    }

    private void sendEmailWithAttachment(InvoiceDto invoice, byte[] pdfBytes) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(invoice.client().email());
        helper.setSubject("New Invoice from LedgerOne: " + invoice.invoiceNumber());

        String htmlContent = buildHtmlTemplate(invoice);
        helper.setText(htmlContent, true);

        // Attach the PDF
        String filename = invoice.invoiceNumber() + ".pdf";
        helper.addAttachment(filename, new ByteArrayResource(pdfBytes));

        mailSender.send(message);
    }

    private String buildHtmlTemplate(InvoiceDto invoice) {
        // A simple, clean HTML template
        return "<html>" +
                "<body style='font-family: Arial, sans-serif; color: #333; line-height: 1.6;'>" +
                "<div style='max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;'>" +
                "<h2 style='color: #4f46e5;'>New Invoice Created</h2>" +
                "<p>Hello <strong>" + invoice.client().name() + "</strong>,</p>" +
                "<p>A new invoice (<strong>" + invoice.invoiceNumber() + "</strong>) has been generated for you.</p>" +
                "<table style='width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px;'>" +
                "<tr><td style='padding: 8px; border-bottom: 1px solid #e5e7eb;'><strong>Amount Due:</strong></td><td style='padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;'>₹" + invoice.totalAmount() + "</td></tr>" +
                "<tr><td style='padding: 8px; border-bottom: 1px solid #e5e7eb;'><strong>Due Date:</strong></td><td style='padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;'>" + invoice.dueDate() + "</td></tr>" +
                "</table>" +
                "<p>Please find the detailed PDF attached to this email.</p>" +
                "<p>Thank you for your business!</p>" +
                "<p style='color: #9ca3af; font-size: 12px; margin-top: 30px;'>Powered by LedgerOne</p>" +
                "</div>" +
                "</body>" +
                "</html>";
    }
}
