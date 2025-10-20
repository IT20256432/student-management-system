package com.example.SM.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance")
public class Attendance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "student_id", nullable = false)
    private String studentId;
    
    @Column(name = "student_name", nullable = false)
    private String studentName;
    
    @Column(name = "grade", nullable = false)
    private String grade;
    
    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;
    
    @Column(name = "scan_time", nullable = false)
    private LocalDateTime scanTime;
    
    @Column(name = "status", nullable = false)
    private String status; // PRESENT, LATE, ABSENT
    
    @Column(name = "scan_method")
    private String scanMethod; // QR, MANUAL
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // CHANGED: Added @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    @JsonIgnore
    private AttendanceSession attendanceSession;

    public Attendance() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters remain the same...
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

    public AttendanceSession getAttendanceSession() { return attendanceSession; }
    public void setAttendanceSession(AttendanceSession attendanceSession) { this.attendanceSession = attendanceSession; }
}