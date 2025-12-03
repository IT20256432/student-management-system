package com.example.SM.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendQRCodeEmail(String toEmail, String studentName, String studentId, 
                               byte[] qrCodeImage, String className) throws MessagingException {
        
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setFrom("school-management@yourschool.com");
        helper.setTo(toEmail);
        helper.setSubject("🎓 Your Student QR Code - " + studentId);

        String emailContent = """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; color: #333; }
                    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    .qr-section { text-align: center; margin: 20px 0; }
                    .info { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 10px 0; }
                    .footer { background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🎓 School Management System</h1>
                    <h2>Your Student QR Code</h2>
                </div>
                
                <div class="content">
                    <p>Dear <strong>%s</strong>,</p>
                    
                    <p>Your registration has been completed successfully! Here is your unique QR code for school activities:</p>
                    
                    <div class="qr-section">
                        <img src="cid:qrCode" alt="Student QR Code" style="width: 250px; height: 250px; border: 2px solid #4CAF50; padding: 10px;">
                        <p><strong>Scan this QR code for:</strong></p>
                        <ul style="text-align: left; display: inline-block;">
                            <li>Attendance marking</li>
                            <li>Fee payments</li>
                            <li>Library access</li>
                            <li>Exam hall entry</li>
                        </ul>
                    </div>
                    
                    <div class="info">
                        <h3>📋 Student Information</h3>
                        <p><strong>Student ID:</strong> %s</p>
                        <p><strong>Student Name:</strong> %s</p>
                        <p><strong>Class:</strong> %s</p>
                        <p><strong>Email:</strong> %s</p>
                    </div>
                    
                    <div class="info">
                        <h3>📱 How to Use Your QR Code</h3>
                        <p>1. <strong>Save this QR code</strong> on your phone</p>
                        <p>2. <strong>Show it at school</strong> for quick scanning</p>
                        <p>3. <strong>Keep it secure</strong> - this is your digital identity</p>
                        <p>4. <strong>Do not share</strong> with others</p>
                    </div>
                </div>
                
                <div class="footer">
                    <p>If you have any questions, please contact the school administration.</p>
                    <p>© 2024 School Management System. All rights reserved.</p>
                </div>
            </body>
            </html>
            """.formatted(studentName, studentId, studentName, className, toEmail);

        helper.setText(emailContent, true);
        
        // Attach QR code as inline image
        helper.addInline("qrCode", new ByteArrayResource(qrCodeImage), "image/png");
        
        // Also attach as downloadable file
        helper.addAttachment("Student-QR-Code-" + studentId + ".png", 
                           new ByteArrayResource(qrCodeImage));

        mailSender.send(message);
    }

    public void sendSimpleEmail(String toEmail, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message);
            
            helper.setFrom("school-management@yourschool.com");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, true);
            
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }
}