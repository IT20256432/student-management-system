package com.example.SM.service;

import com.example.SM.entity.FeePayment;
import com.example.SM.entity.Student;
import com.example.SM.entity.SchoolClass;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.math.BigDecimal;

@Service
public class ReceiptPDFService {
    
    public byte[] generatePaymentReceipt(FeePayment payment, Student student, SchoolClass schoolClass) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);
            
            document.setMargins(50, 50, 50, 50);
            
            PdfFont headerFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont normalFont = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            
            // SCHOOL HEADER
            document.add(new Paragraph("SCHOOL MANAGEMENT SYSTEM")
                .setFont(headerFont)
                .setFontSize(20)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(ColorConstants.DARK_GRAY)
                .setMarginBottom(10));
            
            document.add(new Paragraph("OFFICIAL FEE PAYMENT RECEIPT")
                .setFont(headerFont)
                .setFontSize(16)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(ColorConstants.BLUE)
                .setMarginBottom(20));
            
            // FIXED: Simple date formatting without DateTimeFormatter
            String receiptNo = payment.getTransactionId() != null ? 
                payment.getTransactionId() : "REC-" + System.currentTimeMillis();
            
            // Format date safely
            String formattedDate;
            try {
                // Try different approaches
                if (payment.getPaymentDate() != null) {
                    // Convert to string without complex formatting
                    formattedDate = payment.getPaymentDate().toString()
                        .replace("T", " ") // Remove T from ISO format
                        .split("\\.")[0];  // Remove milliseconds
                } else {
                    formattedDate = "Date not available";
                }
            } catch (Exception e) {
                formattedDate = "Date not available";
            }
            
            Paragraph receiptInfo = new Paragraph()
                .add(new Text("Receipt No: ").setFont(headerFont))
                .add(new Text(receiptNo + "\n").setFont(normalFont))
                .add(new Text("Date: ").setFont(headerFont))
                .add(new Text(formattedDate))
                .setTextAlignment(TextAlignment.LEFT)
                .setMarginBottom(20);
            
            document.add(receiptInfo);
            
            // STUDENT INFORMATION TABLE
            float[] columnWidths = {150f, 350f};
            Table studentTable = new Table(UnitValue.createPercentArray(columnWidths))
                .setMarginBottom(20);
            
            studentTable.addHeaderCell(createHeaderCell("STUDENT INFORMATION"));
            studentTable.addHeaderCell(createHeaderCell(""));
            
            addTableRow(studentTable, "Student ID", student.getStudentId());
            addTableRow(studentTable, "Student Name", 
                student.getFirstName() + " " + student.getLastName());
            addTableRow(studentTable, "Grade", student.getGrade());
            
            if (schoolClass != null) {
                addTableRow(studentTable, "Class", schoolClass.getClassName());
                addTableRow(studentTable, "Class Teacher", schoolClass.getClassTeacher());
            } else {
                addTableRow(studentTable, "Class", "Not Assigned");
                addTableRow(studentTable, "Class Teacher", "N/A");
            }
            
            document.add(studentTable);
            
            // PAYMENT DETAILS TABLE
            Table paymentTable = new Table(UnitValue.createPercentArray(columnWidths))
                .setMarginBottom(20);
            
            paymentTable.addHeaderCell(createHeaderCell("PAYMENT DETAILS"));
            paymentTable.addHeaderCell(createHeaderCell(""));
            
            addTableRow(paymentTable, "Payment Month", payment.getMonth());
            addTableRow(paymentTable, "Payment Method", 
                payment.getPaymentMethod() != null ? payment.getPaymentMethod().toString() : "N/A");
            addTableRow(paymentTable, "Transaction ID", receiptNo);
            addTableRow(paymentTable, "Payment Date", formattedDate);
            addTableRow(paymentTable, "Status", 
                payment.getStatus() != null ? payment.getStatus().toString() : "COMPLETED");
            addTableRow(paymentTable, "Notes", 
                payment.getNotes() != null ? payment.getNotes() : "None");
            
            document.add(paymentTable);
            
            // FEE AMOUNT TABLE
            Table feeTable = new Table(UnitValue.createPercentArray(new float[]{300f, 200f}))
                .setMarginBottom(30);
            
            feeTable.addHeaderCell(createHeaderCell("DESCRIPTION"));
            feeTable.addHeaderCell(createHeaderCell("AMOUNT (Rs.)"));
            
            addFeeRow(feeTable, "Payment Amount", payment.getAmountPaid().doubleValue());
            
            // TOTAL AMOUNT
            Cell totalLabelCell = new Cell(1, 1)
                .add(new Paragraph("TOTAL PAID").setFont(headerFont).setFontSize(12))
                .setTextAlignment(TextAlignment.RIGHT)
                .setPadding(10)
                .setBackgroundColor(ColorConstants.LIGHT_GRAY);
            
            Cell totalAmountCell = new Cell(1, 1)
                .add(new Paragraph(String.format("Rs. %,.2f", payment.getAmountPaid()))
                    .setFont(headerFont)
                    .setFontSize(14)
                    .setFontColor(ColorConstants.GREEN))
                .setTextAlignment(TextAlignment.RIGHT)
                .setPadding(10)
                .setBackgroundColor(ColorConstants.LIGHT_GRAY);
            
            feeTable.addCell(totalLabelCell);
            feeTable.addCell(totalAmountCell);
            
            document.add(feeTable);
            
            // SIGNATURE SECTION
            document.add(new Paragraph("\n\n\n")
                .add(new Text("___________________________\n"))
                .add(new Text("Authorized Signatory\n").setFont(headerFont))
                .add(new Text("School Accounts Department\n"))
                .add(new Text("School Management System\n"))
                .setTextAlignment(TextAlignment.RIGHT)
                .setMarginTop(30));
            
            // FOOTER
            document.add(new Paragraph("\n\nThis is a computer-generated receipt. No signature required.")
                .setFontSize(10)
                .setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setItalic());
            
            document.close();
            
            return baos.toByteArray();
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF receipt: " + e.getMessage(), e);
        }
    }
    
    private Cell createHeaderCell(String text) {
        try {
            PdfFont boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            return new Cell()
                .add(new Paragraph(text).setFont(boldFont).setFontSize(12))
                .setBackgroundColor(ColorConstants.BLUE)
                .setFontColor(ColorConstants.WHITE)
                .setPadding(8);
        } catch (Exception e) {
            return new Cell()
                .add(new Paragraph(text).setBold().setFontSize(12))
                .setBackgroundColor(ColorConstants.BLUE)
                .setFontColor(ColorConstants.WHITE)
                .setPadding(8);
        }
    }
    
    private void addTableRow(Table table, String label, String value) {
        String safeValue = value != null ? value : "N/A";
        table.addCell(new Cell().add(new Paragraph(label).setBold()).setPadding(8));
        table.addCell(new Cell().add(new Paragraph(safeValue)).setPadding(8));
    }
    
    private void addFeeRow(Table table, String description, double amount) {
        table.addCell(new Cell().add(new Paragraph(description)).setPadding(8));
        table.addCell(new Cell().add(new Paragraph(String.format("Rs. %,.2f", amount)))
            .setTextAlignment(TextAlignment.RIGHT)
            .setPadding(8));
    }
}  