package com.ledgerone.invoice.service;

import com.ledgerone.invoice.entity.Invoice;
import com.ledgerone.invoice.entity.InvoiceItem;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;

@Service
public class PdfService {

    private static final float MARGIN = 50f;
    private static final float W = PDRectangle.A4.getWidth();
    private static final float H = PDRectangle.A4.getHeight();

    public byte[] generateInvoicePdf(Invoice invoice) throws IOException {
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

            // ── Bill To | Invoice Details ──────────────────────────
            text(cs, fontBold, 8, MARGIN, y, "BILL TO");
            text(cs, fontBold, 8, W / 2f, y, "INVOICE DETAILS");
            y -= 14;

            String clientName = invoice.getClient().getName();
            text(cs, fontBold, 11, MARGIN, y, clientName);

            text(cs, fontRegular, 10, W / 2f, y, "Issue Date:  " + invoice.getIssueDate());
            y -= 14;

            if (notBlank(invoice.getClient().getCompanyName())) {
                text(cs, fontRegular, 9, MARGIN, y, invoice.getClient().getCompanyName());
            }
            text(cs, fontRegular, 10, W / 2f, y, "Due Date:    " + invoice.getDueDate());
            y -= 14;

            if (notBlank(invoice.getClient().getEmail())) {
                text(cs, fontRegular, 9, MARGIN, y, invoice.getClient().getEmail());
            }
            text(cs, fontRegular, 10, W / 2f, y, "Status:         " + invoice.getStatus());
            y -= 14;

            if (notBlank(invoice.getClient().getPhone())) {
                text(cs, fontRegular, 9, MARGIN, y, invoice.getClient().getPhone());
            }
            y -= 16;

            hLine(cs, MARGIN, y, W - MARGIN, 0.5f);
            y -= 14;

            // ── Items Table Header ──────────────────────────────────
            float colDesc = MARGIN;
            float colQty  = W - 220f;
            float colRate = W - 150f;
            float colAmt  = W - MARGIN;

            text(cs, fontBold, 9, colDesc, y, "DESCRIPTION");
            text(cs, fontBold, 9, colQty,  y, "QTY");
            text(cs, fontBold, 9, colRate, y, "RATE (Rs.)");
            textRight(cs, fontBold, 9, colAmt, y, "AMOUNT (Rs.)", fontBold);
            y -= 6;
            hLine(cs, MARGIN, y, W - MARGIN, 0.5f);
            y -= 14;

            // ── Items ───────────────────────────────────────────────
            for (InvoiceItem item : invoice.getItems()) {
                text(cs, fontRegular, 10, colDesc, y, item.getDescription());
                text(cs, fontRegular, 10, colQty,  y, String.valueOf(item.getQuantity()));
                text(cs, fontRegular, 10, colRate, y, fmt(item.getUnitPrice()));
                textRight(cs, fontRegular, 10, colAmt, y, fmt(item.getAmount()), fontRegular);
                y -= 18;
            }

            y -= 6;
            hLine(cs, MARGIN, y, W - MARGIN, 0.5f);
            y -= 18;

            // ── Totals ──────────────────────────────────────────────
            float labelX = W - 200f;

            text(cs, fontRegular, 10, labelX, y, "Subtotal:");
            textRight(cs, fontRegular, 10, colAmt, y, "Rs. " + fmt(invoice.getSubtotal()), fontRegular);
            y -= 14;

            text(cs, fontRegular, 10, labelX, y,
                    "GST (" + invoice.getGstRate().intValue() + "%):");
            textRight(cs, fontRegular, 10, colAmt, y, "Rs. " + fmt(invoice.getGstAmount()), fontRegular);
            y -= 8;

            hLine(cs, labelX - 5, y, W - MARGIN, 0.5f);
            y -= 16;

            text(cs, fontBold, 12, labelX, y, "TOTAL:");
            textRight(cs, fontBold, 12, colAmt, y, "Rs. " + fmt(invoice.getTotalAmount()), fontBold);

            // ── Notes ───────────────────────────────────────────────
            if (notBlank(invoice.getNotes())) {
                y -= 30;
                hLine(cs, MARGIN, y, W - MARGIN, 0.5f);
                y -= 14;
                text(cs, fontBold, 9, MARGIN, y, "NOTES");
                y -= 13;
                text(cs, fontRegular, 9, MARGIN, y, invoice.getNotes());
            }

            // ── Footer ──────────────────────────────────────────────
            text(cs, fontRegular, 8, MARGIN, 28, "Thank you for your business!  —  Generated by LedgerOne");
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
