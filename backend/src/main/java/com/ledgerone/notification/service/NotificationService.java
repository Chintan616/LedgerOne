package com.ledgerone.notification.service;

import com.ledgerone.invoice.entity.BusinessProfile;
import com.ledgerone.invoice.entity.Invoice;
import com.ledgerone.invoice.service.PdfService;
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
    private final PdfService pdfService;

    public NotificationService(JavaMailSender mailSender, PdfService pdfService) {
        this.mailSender = mailSender;
        this.pdfService = pdfService;
    }

    @Async
    public void processInvoiceNotification(Invoice invoice, BusinessProfile profile) {
        log.info("Processing async notification for invoice ID: {}", invoice.getId());

        try {
            if (invoice.getClient() == null || invoice.getClient().getEmail() == null
                    || invoice.getClient().getEmail().isBlank()) {
                log.error("Cannot send email: Client email is missing for invoice ID: {}", invoice.getId());
                return;
            }

            byte[] pdfBytes = pdfService.generateInvoicePdf(invoice, profile);
            sendEmailWithAttachment(invoice, pdfBytes);

            log.info("Successfully sent email for invoice: {}", invoice.getInvoiceNumber());
        } catch (Exception e) {
            log.error("Failed to process invoice notification for ID: {}", invoice.getId(), e);
        }
    }

    private void sendEmailWithAttachment(Invoice invoice, byte[] pdfBytes) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(invoice.getClient().getEmail());
        helper.setSubject("New Invoice from LedgerOne: " + invoice.getInvoiceNumber());

        String htmlContent = buildHtmlTemplate(invoice);
        helper.setText(htmlContent, true);

        String filename = invoice.getInvoiceNumber() + ".pdf";
        helper.addAttachment(filename, new ByteArrayResource(pdfBytes));

        mailSender.send(message);
    }

    private String buildHtmlTemplate(Invoice invoice) {
        return "<html>" +
                "<body style='font-family: Arial, sans-serif; color: #333; line-height: 1.6;'>" +
                "<div style='max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;'>" +
                "<h2 style='color: #4f46e5;'>New Invoice Created</h2>" +
                "<p>Hello <strong>" + invoice.getClient().getName() + "</strong>,</p>" +
                "<p>A new invoice (<strong>" + invoice.getInvoiceNumber() + "</strong>) has been generated for you.</p>" +
                "<table style='width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px;'>" +
                "<tr><td style='padding: 8px; border-bottom: 1px solid #e5e7eb;'><strong>Amount Due:</strong></td><td style='padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;'>₹" + invoice.getTotalAmount() + "</td></tr>" +
                "<tr><td style='padding: 8px; border-bottom: 1px solid #e5e7eb;'><strong>Due Date:</strong></td><td style='padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;'>" + invoice.getDueDate() + "</td></tr>" +
                "</table>" +
                "<p>Please find the detailed PDF attached to this email.</p>" +
                "<p>Thank you for your business!</p>" +
                "<p style='color: #9ca3af; font-size: 12px; margin-top: 30px;'>Powered by LedgerOne</p>" +
                "</div>" +
                "</body>" +
                "</html>";
    }
}
