package com.example.SM.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class AttendanceResponse {
    private Long id;
    private String studentId;
    private String studentName;
    private String grade;
    private LocalDate attendanceDate;
    private LocalDateTime scanTime;
    private String status;
    private String scanMethod;
    private LocalDateTime createdAt;
    private Long sessionId;
    private String subject;
    private String className;
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    
    public LocalDate getAttendanceDate() { return attendanceDate; }
    public void setAttendanceDate(LocalDate attendanceDate) { this.attendanceDate = attendanceDate; }
    
    public LocalDateTime getScanTime() { return scanTime; }
    public void setScanTime(LocalDateTime scanTime) { this.scanTime = scanTime; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getScanMethod() { return scanMethod; }
    public void setScanMethod(String scanMethod) { this.scanMethod = scanMethod; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    
    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }
}