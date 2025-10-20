package com.example.SM.dto;

public class AttendanceRequest {
    private String studentId;
    private String date;
    private Long sessionId;
    
    // Getters and Setters
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
}