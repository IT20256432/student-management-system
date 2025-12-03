package com.example.SM.service;

import com.example.SM.dto.QRData;
import com.example.SM.entity.Student;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.ByteArrayOutputStream;

@Service
public class QRCodeService {
    
    @Autowired
    private JavaMailSender mailSender;

    // Generate QR code as byte array
    public byte[] generateQRCode(QRData qrData) throws Exception {
        try {
            // Convert QR data to JSON string
            String qrContent = new ObjectMapper().writeValueAsString(qrData);
            
            // Generate QR code
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(qrContent, BarcodeFormat.QR_CODE, 350, 350);
            
            // Convert to PNG byte array
            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            
            return pngOutputStream.toByteArray();
        } catch (Exception e) {
            throw new Exception("Failed to generate QR code: " + e.getMessage(), e);
        }
    }

    // Generate and send QR code via email
    public void generateAndSendQRCode(Student student, String className) {
        try {
            // Create QR data from student information
            QRData qrData = new QRData(
                student.getStudentId(),
                student.getFirstName(),
                student.getLastName(),
                student.getGrade(),
                student.getEmail()
            );
            
            // Generate QR code image
            byte[] qrCodeImage = generateQRCode(qrData);
            
            // Send email with QR code
            sendQRCodeEmail(
                student.getEmail(),
                student.getFirstName() + " " + student.getLastName(),
                student.getStudentId(),
                qrCodeImage,
                className
            );
            
            System.out.println("✅ QR code sent to: " + student.getEmail());
            
        } catch (Exception e) {
            System.err.println("❌ Failed to generate and send QR code: " + e.getMessage());
            throw new RuntimeException("Failed to generate and send QR code: " + e.getMessage());
        }
    }

    // Send email with QR code attachment
    private void sendQRCodeEmail(String toEmail, String studentName, String studentId, 
                               byte[] qrCodeImage, String className) throws MessagingException {
        
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom("noreply@schoolmanagement.com");
        helper.setTo(toEmail);
        helper.setSubject("🎓 Your Student QR Code - " + studentId);

        // Create HTML email content
        String emailContent = createEmailContent(studentName, studentId, className, toEmail);
        helper.setText(emailContent, true);
        
        // Attach QR code as inline image
        helper.addInline("qrCode", new ByteArrayResource(qrCodeImage), "image/png");
        
        // Also attach as downloadable file
        helper.addAttachment("Student-QR-Code-" + studentId + ".png", 
                           new ByteArrayResource(qrCodeImage), "image/png");

        mailSender.send(message);
    }

    // Create HTML email template
    private String createEmailContent(String studentName, String studentId, String className, String email) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { 
                        font-family: 'Arial', sans-serif; 
                        color: #333; 
                        line-height: 1.6;
                        margin: 0;
                        padding: 0;
                        background-color: #f9f9f9;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: white;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #4CAF50, #45a049);
                        color: white;
                        padding: 30px 20px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                    }
                    .header h2 {
                        margin: 10px 0 0 0;
                        font-size: 20px;
                        font-weight: 300;
                    }
                    .content {
                        padding: 30px;
                    }
                    .qr-section {
                        text-align: center;
                        margin: 30px 0;
                        padding: 20px;
                        background: #f8f9fa;
                        border-radius: 8px;
                        border: 2px dashed #4CAF50;
                    }
                    .qr-image {
                        width: 250px;
                        height: 250px;
                        border: 3px solid #4CAF50;
                        border-radius: 10px;
                        padding: 10px;
                        background: white;
                    }
                    .info-card {
                        background: #f1f8e9;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                        border-left: 4px solid #4CAF50;
                    }
                    .info-card h3 {
                        color: #2e7d32;
                        margin-top: 0;
                    }
                    .instructions {
                        background: #e3f2fd;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                        border-left: 4px solid #2196F3;
                    }
                    .footer {
                        background: #333;
                        color: white;
                        padding: 20px;
                        text-align: center;
                        font-size: 12px;
                    }
                    .button {
                        display: inline-block;
                        background: #4CAF50;
                        color: white;
                        padding: 12px 24px;
                        text-decoration: none;
                        border-radius: 5px;
                        margin: 10px 5px;
                        font-weight: bold;
                    }
                    ul {
                        text-align: left;
                        display: inline-block;
                        margin: 0;
                    }
                    li {
                        margin: 8px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎓 School Management System</h1>
                        <h2>Your Digital Student ID</h2>
                    </div>
                    
                    <div class="content">
                        <p>Dear <strong>%s</strong>,</p>
                        
                        <p>Welcome to our school! Your registration has been completed successfully. 
                        Below is your unique QR code that serves as your digital student identity.</p>
                        
                        <div class="qr-section">
                            <img src="cid:qrCode" alt="Student QR Code" class="qr-image">
                            <p style="font-size: 18px; margin-top: 15px;"><strong>Student ID: %s</strong></p>
                        </div>
                        
                        <div class="info-card">
                            <h3>📋 Student Information</h3>
                            <p><strong>Student Name:</strong> %s</p>
                            <p><strong>Student ID:</strong> %s</p>
                            <p><strong>Class:</strong> %s</p>
                            <p><strong>Email:</strong> %s</p>
                        </div>
                        
                        <div class="instructions">
                            <h3>📱 How to Use Your QR Code</h3>
                            <ul>
                                <li><strong>Save this QR code</strong> on your phone for easy access</li>
                                <li><strong>Show it at school</strong> for quick attendance scanning</li>
                                <li><strong>Use it for fee payments</strong> at the accounts office</li>
                                <li><strong>Present it for library access</strong> and book borrowing</li>
                                <li><strong>Keep it secure</strong> - this is your digital identity card</li>
                                <li><strong>Do not share</strong> with others to prevent misuse</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 25px 0;">
                            <p><strong>Need help?</strong> Contact the school administration if you have any questions.</p>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated message. Please do not reply to this email.</p>
                        <p>© 2024 School Management System. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(studentName, studentId, studentName, studentId, className, email);
    }

    // Simple email sending method (optional)
    public void sendSimpleEmail(String toEmail, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message);
            
            helper.setFrom("noreply@schoolmanagement.com");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, true);
            
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }
}