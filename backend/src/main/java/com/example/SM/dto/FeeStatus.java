// In FeeStatus.java - Add new fields
package com.example.SM.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class FeeStatus {
    private String studentId;
    private String studentName;
    private String className;
    private Long classId; 
    private BigDecimal totalDue;
    private BigDecimal totalPaid;
    private BigDecimal balance;
    private String overallStatus;
    private String paymentStatus; // NEW: Detailed status
    private Integer daysOverdue; // NEW: Days overdue
    private Boolean gracePeriodActive; // NEW: Is grace period active?
    private Integer gracePeriodEnds; // NEW: Days left in grace period
    private LocalDate nextDueDate; // NEW: Next due date
    private String lastPaymentDate;

    // Constructors
    public FeeStatus() {}

    public FeeStatus(String studentId, String studentName, String className, Long classId,
                    BigDecimal totalDue, BigDecimal totalPaid, String overallStatus) {
        this.studentId = studentId;
        this.studentName = studentName;
        this.className = className;
        this.classId = classId; 
        this.totalDue = totalDue;
        this.totalPaid = totalPaid;
        this.balance = totalDue.subtract(totalPaid);
        this.overallStatus = overallStatus;
    }

    // Getters and Setters (add new ones)
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }

    public Long getClassId() { return classId; }
    public void setClassId(Long classId) { this.classId = classId; }

    public BigDecimal getTotalDue() { return totalDue; }
    public void setTotalDue(BigDecimal totalDue) { 
        this.totalDue = totalDue; 
        this.balance = totalDue.subtract(this.totalPaid != null ? this.totalPaid : BigDecimal.ZERO);
    }

    public BigDecimal getTotalPaid() { return totalPaid; }
    public void setTotalPaid(BigDecimal totalPaid) { 
        this.totalPaid = totalPaid; 
        this.balance = (this.totalDue != null ? this.totalDue : BigDecimal.ZERO).subtract(totalPaid);
    }

    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }

    public String getOverallStatus() { return overallStatus; }
    public void setOverallStatus(String overallStatus) { this.overallStatus = overallStatus; }

    // NEW: Getter and Setter for paymentStatus
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    // NEW: Getter and Setter for daysOverdue
    public Integer getDaysOverdue() { return daysOverdue; }
    public void setDaysOverdue(Integer daysOverdue) { this.daysOverdue = daysOverdue; }

    // NEW: Getter and Setter for gracePeriodActive
    public Boolean getGracePeriodActive() { return gracePeriodActive; }
    public void setGracePeriodActive(Boolean gracePeriodActive) { this.gracePeriodActive = gracePeriodActive; }

    // NEW: Getter and Setter for gracePeriodEnds
    public Integer getGracePeriodEnds() { return gracePeriodEnds; }
    public void setGracePeriodEnds(Integer gracePeriodEnds) { this.gracePeriodEnds = gracePeriodEnds; }

    // NEW: Getter and Setter for nextDueDate
    public LocalDate getNextDueDate() { return nextDueDate; }
    public void setNextDueDate(LocalDate nextDueDate) { this.nextDueDate = nextDueDate; }

    public String getLastPaymentDate() { return lastPaymentDate; }
    public void setLastPaymentDate(String lastPaymentDate) { this.lastPaymentDate = lastPaymentDate; }
}