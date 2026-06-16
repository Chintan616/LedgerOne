package com.ledgerone.invoice.service;

import com.ledgerone.invoice.entity.BusinessProfile;
import com.ledgerone.invoice.entity.Invoice;
import com.ledgerone.invoice.entity.InvoiceItem;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;

@Service
public class PdfService {

    private static final float MARGIN = 50f;
    private static final float W = PDRectangle.A4.getWidth();
    private static final float H = PDRectangle.A4.getHeight();

    public byte[] generateInvoicePdf(Invoice invoice, BusinessProfile profile) throws IOException {
        PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        PDType1Font fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

        PDDocument doc = new PDDocument();
        PDPage page = new PDPage(PDRectangle.A4);
        doc.addPage(page);

        try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
            float y = H - MARGIN;

            // ── Title ──────────────────────────────────────────────
            text(cs, fontBold, 22, MARGIN, y, "INVOICE");
            textRight(cs, fontRegular, 11, W - MARGIN, y, invoice.getInvoiceNumber(), fontRegular);
            y -= 6;
            hLine(cs, MARGIN, y, W - MARGIN, 1.5f);
            y -= 22;

            // ── FROM & BILL TO Headers ──────────────────────────
            float col1 = MARGIN;
            float col2 = W / 2f - 40f;
            float col3 = W * 3f / 4f - 20f;
            
            cs.setNonStrokingColor(Color.GRAY);
            text(cs, fontBold, 8, col1, y, "FROM");
            text(cs, fontBold, 8, col2, y, "BILL TO");
            text(cs, fontBold, 8, col3, y, "INVOICE DETAILS");
            cs.setNonStrokingColor(Color.BLACK);
            y -= 16;

            // ── Top Row of Details ───────────────────────────────
            float startY = y;
            float currentY1 = y;
            float currentY2 = y;
            float currentY3 = y;

            // FROM details
            if (profile != null) {
                text(cs, fontBold, 11, col1, currentY1, notBlank(profile.getCompanyName()) ? profile.getCompanyName() : profile.getUserEmail());
                currentY1 -= 14;
                if (notBlank(profile.getAddress())) { text(cs, fontRegular, 9, col1, currentY1, profile.getAddress()); currentY1 -= 14; }
                if (notBlank(profile.getEmail())) { text(cs, fontRegular, 9, col1, currentY1, profile.getEmail()); currentY1 -= 14; }
                if (notBlank(profile.getPhone())) { text(cs, fontRegular, 9, col1, currentY1, profile.getPhone()); currentY1 -= 14; }
                if (notBlank(profile.getGstNumber())) { text(cs, fontRegular, 9, col1, currentY1, "GST: " + profile.getGstNumber()); currentY1 -= 14; }
            } else {
                text(cs, fontBold, 11, col1, currentY1, invoice.getUserEmail());
                currentY1 -= 14;
            }

            // BILL TO details
            text(cs, fontBold, 11, col2, currentY2, invoice.getClient().getName());
            currentY2 -= 14;
            if (notBlank(invoice.getClient().getCompanyName())) { text(cs, fontRegular, 9, col2, currentY2, invoice.getClient().getCompanyName()); currentY2 -= 14; }
            if (notBlank(invoice.getClient().getEmail())) { text(cs, fontRegular, 9, col2, currentY2, invoice.getClient().getEmail()); currentY2 -= 14; }
            if (notBlank(invoice.getClient().getPhone())) { text(cs, fontRegular, 9, col2, currentY2, invoice.getClient().getPhone()); currentY2 -= 14; }
            if (notBlank(invoice.getClient().getGstNumber())) { text(cs, fontRegular, 9, col2, currentY2, "GST: " + invoice.getClient().getGstNumber()); currentY2 -= 14; }

            // INVOICE details
            cs.setNonStrokingColor(Color.GRAY); text(cs, fontRegular, 10, col3, currentY3, "Issue Date:"); cs.setNonStrokingColor(Color.BLACK);
            textRight(cs, fontRegular, 10, W - MARGIN, currentY3, String.valueOf(invoice.getIssueDate()), fontRegular);
            currentY3 -= 16;
            cs.setNonStrokingColor(Color.GRAY); text(cs, fontRegular, 10, col3, currentY3, "Due Date:"); cs.setNonStrokingColor(Color.BLACK);
            textRight(cs, fontRegular, 10, W - MARGIN, currentY3, String.valueOf(invoice.getDueDate()), fontRegular);
            currentY3 -= 16;
            cs.setNonStrokingColor(Color.GRAY); text(cs, fontRegular, 10, col3, currentY3, "Status:"); cs.setNonStrokingColor(Color.BLACK);
            textRight(cs, fontBold, 10, W - MARGIN, currentY3, String.valueOf(invoice.getStatus()), fontBold);
            currentY3 -= 16;

            y = Math.min(Math.min(currentY1, currentY2), currentY3) - 20;

            hLine(cs, MARGIN, y, W - MARGIN, 0.5f);
            y -= 14;

            // ── Items Table Header ──────────────────────────────────
            float colDesc = MARGIN + 10;
            float colQty  = W - 260f;
            float colRate = W - 190f;
            float colAmt  = W - MARGIN - 10;

            // Header Background
            cs.setNonStrokingColor(new Color(240, 240, 240)); // Light gray
            cs.addRect(MARGIN, y - 5, W - (2 * MARGIN), 20);
            cs.fill();

            cs.setNonStrokingColor(Color.DARK_GRAY);
            text(cs, fontBold, 9, colDesc, y, "DESCRIPTION");
            text(cs, fontBold, 9, colQty,  y, "QTY");
            text(cs, fontBold, 9, colRate, y, "RATE (Rs.)");
            textRight(cs, fontBold, 9, colAmt, y, "AMOUNT (Rs.)", fontBold);
            cs.setNonStrokingColor(Color.BLACK);
            y -= 14;

            // ── Items ───────────────────────────────────────────────
            for (InvoiceItem item : invoice.getItems()) {
                text(cs, fontRegular, 10, colDesc, y, item.getDescription());
                text(cs, fontRegular, 10, colQty,  y, String.valueOf(item.getQuantity()));
                text(cs, fontRegular, 10, colRate, y, fmt(item.getUnitPrice()));
                textRight(cs, fontRegular, 10, colAmt, y, fmt(item.getAmount()), fontRegular);
                y -= 20;
            }

            hLine(cs, MARGIN, y + 10, W - MARGIN, 0.5f);
            y -= 10;

            // ── Totals ──────────────────────────────────────────────
            float labelX = W - 200f;
            
            cs.setNonStrokingColor(Color.GRAY);
            text(cs, fontRegular, 10, labelX, y, "Subtotal:");
            cs.setNonStrokingColor(Color.BLACK);
            textRight(cs, fontRegular, 10, colAmt, y, "Rs. " + fmt(invoice.getSubtotal()), fontRegular);
            y -= 16;

            cs.setNonStrokingColor(Color.GRAY);
            int gstRateVal = invoice.getGstRate() != null ? invoice.getGstRate().intValue() : 0;
            text(cs, fontRegular, 10, labelX, y, "GST (" + gstRateVal + "%):");
            cs.setNonStrokingColor(Color.BLACK);
            textRight(cs, fontRegular, 10, colAmt, y, "Rs. " + fmt(invoice.getGstAmount()), fontRegular);
            y -= 12;

            hLine(cs, labelX - 5, y, W - MARGIN, 0.5f);
            y -= 20;

            // Total Background Box
            cs.setNonStrokingColor(new Color(245, 245, 255)); // Very light blue
            cs.addRect(labelX - 10, y - 5, W - MARGIN - labelX + 20, 25);
            cs.fill();
            
            cs.setNonStrokingColor(new Color(67, 56, 202)); // Indigo 700
            text(cs, fontBold, 12, labelX, y, "TOTAL:");
            textRight(cs, fontBold, 14, colAmt, y, "Rs. " + fmt(invoice.getTotalAmount()), fontBold);
            cs.setNonStrokingColor(Color.BLACK);

            // ── Notes ───────────────────────────────────────────────
            if (notBlank(invoice.getNotes())) {
                y -= 30;
                hLine(cs, MARGIN, y, W - MARGIN, 0.5f);
                y -= 14;
                text(cs, fontBold, 9, MARGIN, y, "NOTES");
                cs.setNonStrokingColor(Color.DARK_GRAY);
                y -= 13;
                text(cs, fontRegular, 9, MARGIN, y, invoice.getNotes());
                cs.setNonStrokingColor(Color.BLACK);
            }

            // ── Footer ──────────────────────────────────────────────
            cs.setNonStrokingColor(Color.GRAY);
            text(cs, fontRegular, 8, MARGIN, 28, "Thank you for your business!  —  Generated by LedgerOne");
            cs.setNonStrokingColor(Color.BLACK);
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        doc.save(baos);
        doc.close();
        return baos.toByteArray();
    }

    private void text(PDPageContentStream cs, PDType1Font font, float size,
                      float x, float y, String str) throws IOException {
        if (str == null) return;
        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(x, y);
        cs.showText(str);
        cs.endText();
    }

    private void textRight(PDPageContentStream cs, PDType1Font font, float size,
                            float rightEdge, float y, String str,
                            PDType1Font measureFont) throws IOException {
        if (str == null) return;
        float w = measureFont.getStringWidth(str) / 1000f * size;
        text(cs, font, size, rightEdge - w, y, str);
    }

    private void hLine(PDPageContentStream cs, float x1, float y,
                        float x2, float width) throws IOException {
        cs.setLineWidth(width);
        cs.moveTo(x1, y);
        cs.lineTo(x2, y);
        cs.stroke();
    }

    private String fmt(BigDecimal v) {
        return v == null ? "0.00" : String.format("%,.2f", v);
    }

    private boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
