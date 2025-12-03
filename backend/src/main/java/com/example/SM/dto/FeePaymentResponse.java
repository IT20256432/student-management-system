package com.example.SM.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.example.SM.entity.FeePayment;

public class FeePaymentResponse {
    private Long id;
    private String studentId;
    private String studentName;
    private String className;
    private Long classId;
    private BigDecimal amountPaid;
    private LocalDate paymentDate;
    private String month;
    private String paymentMethod;
    private String status;
    private String transactionId;
    private String notes;
    private LocalDateTime createdAt;

    // Default constructor
    public FeePaymentResponse() {}

    // Constructor from FeePayment entity
    public FeePaymentResponse(FeePayment payment) {
        this.id = payment.getId();
        this.amountPaid = payment.getAmountPaid();
        this.paymentDate = payment.getPaymentDate();
        this.month = payment.getMonth();
        this.status = payment.getStatus() != null ? payment.getStatus().name() : "UNKNOWN";
        this.paymentMethod = payment.getPaymentMethod() != null ? payment.getPaymentMethod().name() : "UNKNOWN";
        this.transactionId = payment.getTransactionId();
        this.notes = payment.getNotes();
        this.createdAt = payment.getCreatedAt();
        
        // Safely extract student info
        if (payment.getStudent() != null) {
            this.studentId = payment.getStudent().getStudentId();
            this.studentName = payment.getStudent().getFirstName() + " " + payment.getStudent().getLastName();
        } else {
            this.studentId = "UNKNOWN";
            this.studentName = "Unknown Student";
        }
        
        // Safely extract class info
        if (payment.getSchoolClass() != null) {
            this.className = payment.getSchoolClass().getClassName();
            this.classId = payment.getSchoolClass().getId();
        } else {
            this.className = "No Class";
            this.classId = null;
        }
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    
    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }
    
    public Long getClassId() { return classId; }
    public void setClassId(Long classId) { this.classId = classId; }
    
    public BigDecimal getAmountPaid() { return amountPaid; }
    public void setAmountPaid(BigDecimal amountPaid) { this.amountPaid = amountPaid; }
    
    public LocalDate getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDate paymentDate) { this.paymentDate = paymentDate; }
    
    public String getMonth() { return month; }
    public void setMonth(String month) { this.month = month; }
    
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}