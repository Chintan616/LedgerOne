package com.ledgerone.invoice.service;

import com.ledgerone.invoice.entity.BusinessProfile;
import com.ledgerone.invoice.entity.Invoice;
import com.ledgerone.invoice.entity.InvoiceItem;
import com.ledgerone.invoice.entity.InvoiceStatus;
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

    private static final Color NAVY = new Color(30, 41, 59);
    private static final Color BRAND_BLUE = new Color(29, 78, 216);
    private static final Color LIGHT_BLUE_BG = new Color(239, 246, 255);
    private static final Color GRAY = new Color(107, 114, 128);
    private static final Color LIGHT_LINE = new Color(226, 232, 240);

    public byte[] generateInvoicePdf(Invoice invoice, BusinessProfile profile) throws IOException {
        PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        PDType1Font fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

        String companyName = (profile != null && notBlank(profile.getCompanyName()))
                ? profile.getCompanyName() : invoice.getUserEmail();

        PDDocument doc = new PDDocument();
        PDPage page = new PDPage(PDRectangle.A4);
        doc.addPage(page);

        try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
            float y = H - MARGIN;

            // ── Header: logo badge + company name (left), INVOICE title (right) ──
            filledRect(cs, MARGIN, y - 20, 24, 24, BRAND_BLUE);
            text(cs, fontBold, 13, MARGIN + 8, y - 12, initials(companyName), Color.WHITE);
            text(cs, fontBold, 14, MARGIN + 34, y - 9, companyName, NAVY);
            textRight(cs, fontBold, 24, W - MARGIN, y, "INVOICE", fontBold, NAVY);

            y -= 24;
            textRight(cs, fontBold, 11, W - MARGIN, y, invoice.getInvoiceNumber(), fontBold, BRAND_BLUE);

            y -= 12;
            hLine(cs, MARGIN, y, W - MARGIN, 1.5f, BRAND_BLUE);
            y -= 24;

            // ── FROM / BILL TO / INVOICE DETAILS ──
            float col1 = MARGIN;
            float col2 = MARGIN + 200f;
            float cardW = 175f;
            float cardX = W - MARGIN - cardW;
            float cardHeight = 86f;
            float cardTop = y + 2;

            filledRect(cs, cardX - 12, cardTop - cardHeight, cardW + 12, cardHeight, LIGHT_BLUE_BG);

            text(cs, fontBold, 8, col1, y, "FROM", BRAND_BLUE);
            text(cs, fontBold, 8, col2, y, "BILL TO", BRAND_BLUE);
            text(cs, fontBold, 8, cardX, y, "INVOICE DETAILS", BRAND_BLUE);

            float fromY = y - 16;
            text(cs, fontBold, 11, col1, fromY, companyName, Color.BLACK);
            fromY -= 14;
            if (profile != null) {
                if (notBlank(profile.getAddress())) { fromY = textWrapped(cs, fontRegular, 9, col1, fromY, 185f, profile.getAddress(), Color.BLACK, 13f); }
                if (notBlank(profile.getEmail()))   { text(cs, fontRegular, 9, col1, fromY, profile.getEmail(), Color.BLACK); fromY -= 13; }
                if (notBlank(profile.getPhone()))   { text(cs, fontRegular, 9, col1, fromY, profile.getPhone(), Color.BLACK); fromY -= 13; }
                if (notBlank(profile.getGstNumber())) { text(cs, fontRegular, 9, col1, fromY, "GSTIN: " + profile.getGstNumber(), Color.BLACK); fromY -= 13; }
            }

            float billY = y - 16;
            text(cs, fontBold, 11, col2, billY, invoice.getClient().getName(), Color.BLACK);
            billY -= 14;
            if (notBlank(invoice.getClient().getCompanyName())) { text(cs, fontRegular, 9, col2, billY, invoice.getClient().getCompanyName(), Color.BLACK); billY -= 13; }
            if (notBlank(invoice.getClient().getEmail()))       { text(cs, fontRegular, 9, col2, billY, invoice.getClient().getEmail(), Color.BLACK); billY -= 13; }
            if (notBlank(invoice.getClient().getPhone()))       { text(cs, fontRegular, 9, col2, billY, invoice.getClient().getPhone(), Color.BLACK); billY -= 13; }
            if (notBlank(invoice.getClient().getGstNumber()))   { text(cs, fontRegular, 9, col2, billY, "GSTIN: " + invoice.getClient().getGstNumber(), Color.BLACK); billY -= 13; }

            float detailY = y - 16;
            detailRow(cs, fontRegular, "Issue Date", String.valueOf(invoice.getIssueDate()), cardX, detailY);
            detailY -= 16;
            detailRow(cs, fontRegular, "Due Date", String.valueOf(invoice.getDueDate()), cardX, detailY);
            detailY -= 16;
            detailRow(cs, fontRegular, "Invoice No.", invoice.getInvoiceNumber(), cardX, detailY);
            detailY -= 16;
            text(cs, fontRegular, 9, cardX, detailY, "Status", GRAY);
            textRight(cs, fontBold, 9, W - MARGIN, detailY, invoice.getStatus().name(), fontBold, statusColor(invoice.getStatus()));

            y = Math.min(fromY, Math.min(billY, cardTop - cardHeight)) - 14;

            hLine(cs, MARGIN, y, W - MARGIN, 0.75f, LIGHT_LINE);
            y -= 16;

            // ── Items Table ──
            float colDesc = MARGIN + 10;
            float colQty  = W - 260f;
            float colRate = W - 190f;
            float colAmt  = W - MARGIN - 10;

            filledRect(cs, MARGIN, y - 6, W - 2 * MARGIN, 20, BRAND_BLUE);
            text(cs, fontBold, 9, colDesc, y, "DESCRIPTION", Color.WHITE);
            text(cs, fontBold, 9, colQty, y, "QTY", Color.WHITE);
            text(cs, fontBold, 9, colRate, y, "RATE (Rs.)", Color.WHITE);
            textRight(cs, fontBold, 9, colAmt, y, "AMOUNT (Rs.)", fontBold, Color.WHITE);
            y -= 22;

            for (InvoiceItem item : invoice.getItems()) {
                text(cs, fontRegular, 10, colDesc, y, item.getDescription(), Color.BLACK);
                text(cs, fontRegular, 10, colQty, y, String.valueOf(item.getQuantity()), Color.BLACK);
                text(cs, fontRegular, 10, colRate, y, fmt(item.getUnitPrice()), Color.BLACK);
                textRight(cs, fontRegular, 10, colAmt, y, fmt(item.getAmount()), fontRegular, Color.BLACK);
                y -= 20;
            }

            hLine(cs, MARGIN, y + 10, W - MARGIN, 0.75f, LIGHT_LINE);
            y -= 10;

            // ── Totals ──
            float labelX = W - 200f;
            text(cs, fontRegular, 10, labelX, y, "Subtotal", GRAY);
            textRight(cs, fontRegular, 10, colAmt, y, "Rs. " + fmt(invoice.getSubtotal()), fontRegular, Color.BLACK);
            y -= 18;

            int gstRateVal = invoice.getGstRate() != null ? invoice.getGstRate().intValue() : 0;
            text(cs, fontRegular, 10, labelX, y, "GST (" + gstRateVal + "%)", GRAY);
            textRight(cs, fontRegular, 10, colAmt, y, "Rs. " + fmt(invoice.getGstAmount()), fontRegular, Color.BLACK);
            y -= 14;

            hLine(cs, labelX - 10, y, W - MARGIN, 0.75f, LIGHT_LINE);
            y -= 22;

            filledRect(cs, labelX - 10, y - 7, W - MARGIN - labelX + 20, 26, LIGHT_BLUE_BG);
            text(cs, fontBold, 12, labelX, y, "TOTAL", BRAND_BLUE);
            textRight(cs, fontBold, 14, colAmt, y, "Rs. " + fmt(invoice.getTotalAmount()), fontBold, BRAND_BLUE);

            // ── Footer: payment info / notes / signature, anchored near the bottom ──
            float footerTop = 168f;
            hLine(cs, MARGIN, footerTop, W - MARGIN, 0.75f, LIGHT_LINE);

            float leftX = MARGIN;
            float rightX = MARGIN + 280f;
            float fy = footerTop - 18;

            boolean hasBankDetails = profile != null && (
                    notBlank(profile.getBankName()) || notBlank(profile.getAccountNumber()) || notBlank(profile.getIfscCode())
            );

            if (hasBankDetails) {
                text(cs, fontBold, 9, leftX, fy, "PAYMENT INFORMATION", BRAND_BLUE);
                float py = fy - 16;
                if (notBlank(profile.getBankName()))      { labelRow(cs, fontRegular, "Bank Name", profile.getBankName(), leftX, py); py -= 14; }
                if (notBlank(profile.getAccountNumber())) { labelRow(cs, fontRegular, "Account No.", profile.getAccountNumber(), leftX, py); py -= 14; }
                if (notBlank(profile.getIfscCode()))      { labelRow(cs, fontRegular, "IFSC Code", profile.getIfscCode(), leftX, py); py -= 14; }
                labelRow(cs, fontRegular, "Account Name", companyName, leftX, py);
            } else {
                text(cs, fontRegular, 9, leftX, fy, "Thank you for your business!", GRAY);
            }

            text(cs, fontBold, 9, rightX, fy, "NOTES", BRAND_BLUE);
            float ny = fy - 16;
            text(cs, fontRegular, 9, rightX, ny,
                    notBlank(invoice.getNotes()) ? invoice.getNotes() : "Payment is due within the date shown above.",
                    GRAY);

            hLine(cs, rightX, 58f, rightX + 150f, 0.75f, GRAY);
            text(cs, fontRegular, 9, rightX, 46f, "Authorized Signature", GRAY);
            text(cs, fontBold, 9, rightX, 34f, companyName, Color.BLACK);

            // ── Bottom contact bar ──
            filledRect(cs, 0, 0, W, 26, BRAND_BLUE);
            String contact = buildContactLine(profile);
            float contactWidth = fontRegular.getStringWidth(contact) / 1000f * 8;
            text(cs, fontRegular, 8, (W - contactWidth) / 2f, 10f, contact, Color.WHITE);
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        doc.save(baos);
        doc.close();
        return baos.toByteArray();
    }

    private String buildContactLine(BusinessProfile profile) {
        StringBuilder contact = new StringBuilder();
        if (profile != null) {
            if (notBlank(profile.getEmail())) appendPart(contact, profile.getEmail());
            if (notBlank(profile.getPhone())) appendPart(contact, profile.getPhone());
            if (notBlank(profile.getAddress())) appendPart(contact, profile.getAddress());
        }
        return contact.length() == 0 ? "Generated by LedgerOne" : contact.toString();
    }

    private void appendPart(StringBuilder sb, String part) {
        if (sb.length() > 0) sb.append("   |   ");
        sb.append(part);
    }

    private void detailRow(PDPageContentStream cs, PDType1Font font, String label, String value, float x, float y) throws IOException {
        text(cs, font, 9, x, y, label, GRAY);
        textRight(cs, font, 9, W - MARGIN, y, value, font, Color.BLACK);
    }

    private void labelRow(PDPageContentStream cs, PDType1Font font, String label, String value, float x, float y) throws IOException {
        text(cs, font, 9, x, y, label, GRAY);
        text(cs, font, 9, x + 90, y, value, Color.BLACK);
    }

    private void text(PDPageContentStream cs, PDType1Font font, float size,
                       float x, float y, String str, Color color) throws IOException {
        if (str == null || str.isBlank()) return;
        cs.setNonStrokingColor(color);
        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(x, y);
        cs.showText(str);
        cs.endText();
    }

    private float textWrapped(PDPageContentStream cs, PDType1Font font, float size,
                               float x, float y, float maxWidth, String str,
                               Color color, float lineHeight) throws IOException {
        if (str == null || str.isBlank()) return y;
        StringBuilder line = new StringBuilder();
        for (String word : str.split("\\s+")) {
            String candidate = line.length() == 0 ? word : line + " " + word;
            float w = font.getStringWidth(candidate) / 1000f * size;
            if (w > maxWidth && line.length() > 0) {
                text(cs, font, size, x, y, line.toString(), color);
                y -= lineHeight;
                line = new StringBuilder(word);
            } else {
                line = new StringBuilder(candidate);
            }
        }
        if (line.length() > 0) {
            text(cs, font, size, x, y, line.toString(), color);
            y -= lineHeight;
        }
        return y;
    }

    private void textRight(PDPageContentStream cs, PDType1Font font, float size,
                            float rightEdge, float y, String str,
                            PDType1Font measureFont, Color color) throws IOException {
        if (str == null || str.isBlank()) return;
        float w = measureFont.getStringWidth(str) / 1000f * size;
        text(cs, font, size, rightEdge - w, y, str, color);
    }

    private void hLine(PDPageContentStream cs, float x1, float y,
                        float x2, float width, Color color) throws IOException {
        cs.setStrokingColor(color);
        cs.setLineWidth(width);
        cs.moveTo(x1, y);
        cs.lineTo(x2, y);
        cs.stroke();
    }

    private void filledRect(PDPageContentStream cs, float x, float yBottom,
                             float width, float height, Color color) throws IOException {
        cs.setNonStrokingColor(color);
        cs.addRect(x, yBottom, width, height);
        cs.fill();
    }

    private String initials(String name) {
        if (name == null || name.isBlank()) return "?";
        return name.trim().substring(0, 1).toUpperCase();
    }

    private Color statusColor(InvoiceStatus status) {
        return switch (status) {
            case PAID -> new Color(22, 163, 74);
            case SENT -> new Color(37, 99, 235);
            case OVERDUE -> new Color(220, 38, 38);
            case DRAFT -> GRAY;
        };
    }

    private String fmt(BigDecimal v) {
        return v == null ? "0.00" : String.format("%,.2f", v);
    }

    private boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
