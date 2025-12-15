// src/main/java/com/example/SM/service/FeePaymentService.java
package com.example.SM.service;

import com.example.SM.dto.FeePaymentRequest;
import com.example.SM.dto.FeePaymentResponse;
import com.example.SM.dto.FeeStatus;
import com.example.SM.entity.FeePayment;
import com.example.SM.entity.FeeStructure;
import com.example.SM.entity.SchoolClass;
import com.example.SM.entity.Student;
import com.example.SM.repository.FeePaymentRepository;
import com.example.SM.repository.FeeStructureRepository;
import com.example.SM.repository.SchoolClassRepository;
import com.example.SM.repository.StudentRepository;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FeePaymentService {
    
    @Autowired
    private FeePaymentRepository feePaymentRepository;
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private FeeStructureRepository feeStructureRepository;
    
    @Autowired
    private SchoolClassRepository schoolClassRepository;
    
    @Autowired
    private JavaMailSender mailSender;
    
    @Autowired
    private ReceiptPDFService receiptPDFService;
    
    
    public FeePayment recordPayment(FeePaymentRequest request) {
        try {
            System.out.println("🔄 Recording payment for student: " + request.getStudentId());
            
            // Validate student exists
            Student student = studentRepository.findByStudentId(request.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + request.getStudentId()));
            
            // Validate class exists
            SchoolClass schoolClass = schoolClassRepository.findById(request.getClassId())
                .orElseThrow(() -> new RuntimeException("Class not found with ID: " + request.getClassId()));
            
            // Get fee structure for the class
            FeeStructure feeStructure = feeStructureRepository.findBySchoolClassId(request.getClassId())
                .orElseThrow(() -> new RuntimeException("Fee structure not found for class: " + schoolClass.getClassName()));
            
            // Check if payment already exists for this student, month, and class
            Optional<FeePayment> existingPayment = feePaymentRepository
                .findByStudentStudentIdAndMonthAndSchoolClassId(request.getStudentId(), request.getMonth(), request.getClassId());
            
            if (existingPayment.isPresent()) {
                throw new RuntimeException("Payment already recorded for " + request.getMonth() + " in class " + schoolClass.getClassName());
            }
            
            // Create and save payment
            FeePayment payment = new FeePayment();
            payment.setStudent(student);
            payment.setFeeStructure(feeStructure);
            payment.setSchoolClass(schoolClass);
            payment.setAmountPaid(request.getAmountPaid());
            payment.setPaymentDate(request.getPaymentDate() != null ? request.getPaymentDate() : LocalDate.now());
            payment.setMonth(request.getMonth());
            
            // Convert string to enum for payment method
            try {
                payment.setPaymentMethod(FeePayment.PaymentMethod.valueOf(request.getPaymentMethod()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid payment method: " + request.getPaymentMethod());
            }
            
            payment.setTransactionId(request.getTransactionId());
            payment.setNotes(request.getNotes());
            
            // Set status based on payment amount
            if (request.getAmountPaid().compareTo(feeStructure.getTotalFee()) >= 0) {
                payment.setStatus(FeePayment.PaymentStatus.PAID);
            } else if (request.getAmountPaid().compareTo(BigDecimal.ZERO) > 0) {
                payment.setStatus(FeePayment.PaymentStatus.PARTIAL);
            } else {
                payment.setStatus(FeePayment.PaymentStatus.PENDING);
            }
            
            FeePayment savedPayment = feePaymentRepository.save(payment);
            System.out.println("✅ Payment recorded successfully: " + savedPayment.getId());
            
            return savedPayment;
            
        } catch (Exception e) {
            System.err.println("💥 Error recording payment: " + e.getMessage());
            throw new RuntimeException("Failed to record payment: " + e.getMessage());
        }
    }
    
    // ADD THIS METHOD - Get Student Payments
    public List<FeePaymentResponse> getStudentPayments(String studentId) {
        try {
            System.out.println("🔄 Getting payments for student: " + studentId);
            
            List<FeePayment> payments = feePaymentRepository.findByStudentStudentIdOrderByPaymentDateDesc(studentId);
            
            return payments.stream()
                .map(FeePaymentResponse::new)
                .collect(Collectors.toList());
            
        } catch (Exception e) {
            System.err.println("💥 Error getting student payments: " + e.getMessage());
            return new ArrayList<>();
        }
    }
    
    
    
    public List<FeePaymentResponse> getRecentPayments() {
        try {
            System.out.println("🔄 Getting recent payments...");
            
            LocalDate startDate = LocalDate.now().minusDays(30);
            List<FeePayment> payments = feePaymentRepository.findRecentPayments(startDate);
            
            System.out.println("✅ Found " + payments.size() + " recent payments");
            
            // Convert to DTO to avoid serialization issues
            List<FeePaymentResponse> response = payments.stream()
                .map(FeePaymentResponse::new)
                .collect(Collectors.toList());
            
            return response;
            
        } catch (Exception e) {
            System.err.println("💥 Error in getRecentPayments: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
    
    public List<FeeStatus> getOverdueStudents() {
        try {
            System.out.println("🔄 Getting overdue students...");
            
            // Simple implementation - get all students and check their status
            List<Student> allStudents = studentRepository.findAll();
            List<FeeStatus> overdueStudents = new ArrayList<>();
            
            for (Student student : allStudents) {
                try {
                    FeeStatus status = getFeeStatus(student.getStudentId());
                    if ("PENDING".equals(status.getOverallStatus()) || "PARTIAL".equals(status.getOverallStatus())) {
                        overdueStudents.add(status);
                    }
                } catch (Exception e) {
                    // Skip students with errors
                    System.err.println("Skipping student " + student.getStudentId() + ": " + e.getMessage());
                }
            }
            
            return overdueStudents;
            
        } catch (Exception e) {
            System.err.println("💥 Error in getOverdueStudents: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
    
    public Map<String, Object> getFeeStatistics() {
        try {
            System.out.println("🔄 Getting fee statistics...");
            
            List<FeePayment> allPayments = feePaymentRepository.findAll();
            BigDecimal totalCollected = allPayments.stream()
                .map(FeePayment::getAmountPaid)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // Get overdue count
            List<FeeStatus> overdueStudents = getOverdueStudents();
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalCollected", totalCollected);
            stats.put("pendingStudents", overdueStudents.size());
            stats.put("totalStudents", studentRepository.count());
            stats.put("collectionRate", studentRepository.count() > 0 ? 
                (studentRepository.count() - overdueStudents.size()) * 100.0 / studentRepository.count() : 0);
            stats.put("recentPaymentCount", allPayments.size());
            
            System.out.println("✅ Statistics calculated: " + stats);
            return stats;
            
        } catch (Exception e) {
            System.err.println("💥 Error in getFeeStatistics: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorStats = new HashMap<>();
            errorStats.put("totalCollected", 0);
            errorStats.put("pendingStudents", 0);
            errorStats.put("totalStudents", 0);
            errorStats.put("collectionRate", 0);
            errorStats.put("recentPaymentCount", 0);
            return errorStats;
        }
    }
        public FeeStatus getFeeStatus(String studentId) {
        try {
            System.out.println("🔄 Getting fee status for student: " + studentId);
            
            Student student = studentRepository.findByStudentId(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
            
            // Get current date info using proper LocalDate methods
            LocalDate today = LocalDate.now();
            int currentDay = today.getDayOfMonth();
            int currentMonthValue = today.getMonthValue();  // Changed from getMonthValue()
            int currentYear = today.getYear();  // Changed from getFullYear()
            
            // Current month in YYYY-MM format
            String currentMonthStr = String.format("%04d-%02d", currentYear, currentMonthValue);
            
            // Get student's assigned class
            if (student.getSchoolClass() == null) {
                throw new RuntimeException("Student is not assigned to any class");
            }
            
            // Get fee structure for student's assigned class
            FeeStructure feeStructure = feeStructureRepository.findBySchoolClassId(student.getSchoolClass().getId())
                .orElseThrow(() -> new RuntimeException("Fee structure not found for student's class"));
            
            // Calculate total paid for current month
            BigDecimal totalPaid = feePaymentRepository.findTotalPaidByStudentAndMonth(studentId, currentMonthStr);
            if (totalPaid == null) totalPaid = BigDecimal.ZERO;
            
            BigDecimal totalDue = feeStructure.getTotalFee();
            BigDecimal balance = totalDue.subtract(totalPaid);
            
            // Determine fee payment status with 2-week grace period
            String status;
            String paymentStatus = "UNKNOWN";
            
            // Check if payment is complete
            if (totalPaid.compareTo(totalDue) >= 0) {
                status = "PAID";
                paymentStatus = "COMPLETE";
            } 
            // Check if within grace period (first 14 days of month)
            else if (currentDay <= 14) {
                if (totalPaid.compareTo(BigDecimal.ZERO) > 0) {
                    status = "PARTIAL";
                    paymentStatus = "IN_PROGRESS";
                } else {
                    status = "PENDING";
                    paymentStatus = "GRACE_PERIOD";
                }
            } 
            // After grace period (15th onward)
            else {
                if (totalPaid.compareTo(BigDecimal.ZERO) == 0) {
                    status = "OVERDUE";
                    paymentStatus = "UNPAID";
                } else {
                    status = "OVERDUE";
                    paymentStatus = "PARTIAL_OVERDUE";
                }
            }
            
            // Calculate days overdue (if any)
            Integer daysOverdue = null;
            if (status.equals("OVERDUE")) {
                daysOverdue = currentDay - 15; // Starts counting from 15th
                if (daysOverdue < 0) daysOverdue = 0;
            }
            
            FeeStatus feeStatus = new FeeStatus();
            feeStatus.setStudentId(studentId);
            feeStatus.setStudentName(student.getFirstName() + " " + student.getLastName());
            feeStatus.setClassName(student.getSchoolClass().getClassName());
            feeStatus.setClassId(student.getSchoolClass().getId());
            feeStatus.setTotalDue(totalDue);
            feeStatus.setTotalPaid(totalPaid);
            feeStatus.setBalance(balance);
            feeStatus.setOverallStatus(status);
            feeStatus.setPaymentStatus(paymentStatus);
            feeStatus.setDaysOverdue(daysOverdue);
            feeStatus.setGracePeriodActive(currentDay <= 14);
            feeStatus.setGracePeriodEnds(currentDay <= 14 ? 14 - currentDay : 0);
            
            // Calculate next due date
            if (currentDay <= 14) {
                // 15th of current month
                feeStatus.setNextDueDate(LocalDate.of(currentYear, currentMonthValue, 15));
            } else {
                // 1st of next month
                if (currentMonthValue == 12) {
                    // December -> January next year
                    feeStatus.setNextDueDate(LocalDate.of(currentYear + 1, 1, 1));
                } else {
                    feeStatus.setNextDueDate(LocalDate.of(currentYear, currentMonthValue + 1, 1));
                }
            }
            
            return feeStatus;
            
        } catch (Exception e) {
            System.err.println("💥 Error getting fee status: " + e.getMessage());
            e.printStackTrace(); // Add this for debugging
            // Return default status
            FeeStatus feeStatus = new FeeStatus();
            feeStatus.setStudentId(studentId);
            feeStatus.setStudentName("Unknown Student");
            feeStatus.setClassName("No Class");
            feeStatus.setTotalDue(BigDecimal.ZERO);
            feeStatus.setTotalPaid(BigDecimal.ZERO);
            feeStatus.setBalance(BigDecimal.ZERO);
            feeStatus.setOverallStatus("PENDING");
            feeStatus.setPaymentStatus("ERROR");
            return feeStatus;
        }
    }
        
     // Add this method to your FeePaymentService class
        public void sendPaymentConfirmation(Long paymentId) throws MessagingException {
            try {
                System.out.println("📧 Sending payment confirmation email...");
                
                // Fetch the payment with all details
                FeePayment payment = feePaymentRepository.findById(paymentId)
                    .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));
                
                Student student = payment.getStudent();
                SchoolClass schoolClass = payment.getSchoolClass();
                
                // Create HTML email
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                
                // Set email details
                helper.setTo(student.getEmail());
                helper.setFrom("accounts@schoolmanagement.com");
                helper.setSubject("✅ Fee Payment Confirmation - " + payment.getMonth());
                
                // Generate email content
                String emailContent = generatePaymentConfirmationEmail(student, schoolClass, payment);
                helper.setText(emailContent, true);
                
                // Send email
                mailSender.send(message);
                System.out.println("✅ Payment confirmation email sent to: " + student.getEmail());
                
            } catch (Exception e) {
                System.err.println("❌ Failed to send confirmation email: " + e.getMessage());
                throw new MessagingException("Failed to send confirmation email: " + e.getMessage());
            }
        }

        private String generatePaymentConfirmationEmail(Student student, SchoolClass schoolClass, FeePayment payment) {
            String studentName = student.getFirstName() + " " + student.getLastName();
            String className = schoolClass != null ? schoolClass.getClassName() : "Not Assigned";
            
            return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: 'Arial', sans-serif; color: #333; line-height: 1.6; }
                        .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 10px; overflow: hidden; }
                        .header { background: #4CAF50; color: white; padding: 30px 20px; text-align: center; }
                        .content { padding: 30px; background: white; }
                        .payment-details { background: #f1f8e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50; }
                        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 5px 0; border-bottom: 1px solid #eee; }
                        .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
                        .success-icon { font-size: 24px; color: #4CAF50; margin-right: 10px; }
                        .amount { font-size: 24px; color: #2E7D32; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎓 School Management System</h1>
                            <h2>Payment Confirmation Receipt</h2>
                        </div>
                        
                        <div class="content">
                            <p>Dear <strong>%s</strong>,</p>
                            
                            <p>This email confirms that your fee payment has been successfully processed and recorded in our system.</p>
                            
                            <div class="payment-details">
                                <h3 style="color: #2E7D32; margin-top: 0;">
                                    <span class="success-icon">✅</span> Payment Confirmed
                                </h3>
                                
                                <div class="detail-row">
                                    <span><strong>Student ID:</strong></span>
                                    <span>%s</span>
                                </div>
                                <div class="detail-row">
                                    <span><strong>Student Name:</strong></span>
                                    <span>%s</span>
                                </div>
                                <div class="detail-row">
                                    <span><strong>Class:</strong></span>
                                    <span>%s</span>
                                </div>
                                <div class="detail-row">
                                    <span><strong>Payment Amount:</strong></span>
                                    <span class="amount">Rs. %,.2f</span>
                                </div>
                                <div class="detail-row">
                                    <span><strong>For Month:</strong></span>
                                    <span>%s</span>
                                </div>
                                <div class="detail-row">
                                    <span><strong>Payment Method:</strong></span>
                                    <span>%s</span>
                                </div>
                                <div class="detail-row">
                                    <span><strong>Transaction ID:</strong></span>
                                    <span>%s</span>
                                </div>
                                <div class="detail-row">
                                    <span><strong>Payment Date:</strong></span>
                                    <span>%s</span>
                                </div>
                                <div class="detail-row">
                                    <span><strong>Payment Status:</strong></span>
                                    <span style="color: #4CAF50; font-weight: bold;">COMPLETED</span>
                                </div>
                            </div>
                            
                            <p><strong>Important Notes:</strong></p>
                            <ul>
                                <li>Please keep this email as your payment receipt</li>
                                <li>Present this receipt if any payment verification is needed</li>
                                <li>For any queries, contact the school accounts department</li>
                            </ul>
                            
                            <p>Thank you for your timely payment.</p>
                            
                            <p>Best regards,<br>
                            <strong>School Accounts Department</strong><br>
                            School Management System</p>
                        </div>
                        
                        <div class="footer">
                            <p>This is an automated message. Please do not reply to this email.</p>
                            <p>© 2024 School Management System. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                    studentName,
                    student.getStudentId(),
                    studentName,
                    className,
                    payment.getAmountPaid(),
                    payment.getMonth(),
                    payment.getPaymentMethod().toString(),
                    payment.getTransactionId() != null ? payment.getTransactionId() : "N/A",
                    payment.getPaymentDate().toString()
                );
        }
}