package com.example.SM.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "attendance_sessions")
public class AttendanceSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private SchoolClass schoolClass; // Keep this without @JsonIgnore for basic info

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "scheduled_start_time", nullable = false)
    private LocalTime scheduledStartTime;

    @Column(name = "scheduled_end_time", nullable = false)
    private LocalTime scheduledEndTime;

    @Column(name = "actual_start_time")
    private LocalTime actualStartTime;

    @Column(name = "actual_end_time")
    private LocalTime actualEndTime;

    @Column(nullable = false)
    private String subject;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status = SessionStatus.SCHEDULED;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // CHANGED: Added @JsonIgnore
    @OneToMany(mappedBy = "attendanceSession", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Attendance> attendanceRecords = new ArrayList<>();

    public enum SessionStatus {
        SCHEDULED, ACTIVE, COMPLETED, CANCELLED
    }

    // Constructors and other methods remain the same...
    public AttendanceSession() {
        this.createdAt = LocalDateTime.now();
    }

    public AttendanceSession(SchoolClass schoolClass, LocalDate date, LocalTime scheduledStartTime, 
                           LocalTime scheduledEndTime, String subject) {
        this();
        this.schoolClass = schoolClass;
        this.date = date;
        this.scheduledStartTime = scheduledStartTime;
        this.scheduledEndTime = scheduledEndTime;
        this.subject = subject;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public SchoolClass getSchoolClass() { return schoolClass; }
    public void setSchoolClass(SchoolClass schoolClass) { this.schoolClass = schoolClass; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public LocalTime getScheduledStartTime() { return scheduledStartTime; }
    public void setScheduledStartTime(LocalTime scheduledStartTime) { this.scheduledStartTime = scheduledStartTime; }

    public LocalTime getScheduledEndTime() { return scheduledEndTime; }
    public void setScheduledEndTime(LocalTime scheduledEndTime) { this.scheduledEndTime = scheduledEndTime; }

    public LocalTime getActualStartTime() { return actualStartTime; }
    public void setActualStartTime(LocalTime actualStartTime) { this.actualStartTime = actualStartTime; }

    public LocalTime getActualEndTime() { return actualEndTime; }
    public void setActualEndTime(LocalTime actualEndTime) { this.actualEndTime = actualEndTime; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public SessionStatus getStatus() { return status; }
    public void setStatus(SessionStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<Attendance> getAttendanceRecords() { return attendanceRecords; }
    public void setAttendanceRecords(List<Attendance> attendanceRecords) { this.attendanceRecords = attendanceRecords; }
}