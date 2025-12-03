package com.example.SM.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class FeePaymentRequest {
    private String studentId;
    private Long classId; // ADD THIS
    private BigDecimal amountPaid;
    private LocalDate paymentDate;
    private String month;
    private String paymentMethod;
    private String transactionId;
    private String notes;

    public FeePaymentRequest() {}

    public FeePaymentRequest(String studentId, Long classId, BigDecimal amountPaid, LocalDate paymentDate, 
                           String month, String paymentMethod, String transactionId, String notes) {
        this.studentId = studentId;
        this.classId = classId; // ADD THIS
        this.amountPaid = amountPaid;
        this.paymentDate = paymentDate;
        this.month = month;
        this.paymentMethod = paymentMethod;
        this.transactionId = transactionId;
        this.notes = notes;
    }

    // Getters and Setters
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public Long getClassId() { return classId; } // ADD THIS
    public void setClassId(Long classId) { this.classId = classId; } // ADD THIS

    public BigDecimal getAmountPaid() { return amountPaid; }
    public void setAmountPaid(BigDecimal amountPaid) { this.amountPaid = amountPaid; }

    public LocalDate getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDate paymentDate) { this.paymentDate = paymentDate; }

    public String getMonth() { return month; }
    public void setMonth(String month) { this.month = month; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}