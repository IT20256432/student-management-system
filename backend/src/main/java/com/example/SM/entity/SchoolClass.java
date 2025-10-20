package com.example.SM.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "school_classes")
public class SchoolClass {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String className;

    @Column(nullable = false)
    private String grade;

    private String stream;

    @Column(name = "class_teacher")
    private String classTeacher;

    @Column(name = "room_number")
    private String roomNumber;

    private boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // CHANGED: Added @JsonIgnore to all relationships
    @OneToMany(mappedBy = "schoolClass", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Student> students = new ArrayList<>();

    @OneToMany(mappedBy = "schoolClass", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ClassSchedule> schedules = new ArrayList<>();

    @OneToMany(mappedBy = "schoolClass", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<AttendanceSession> sessions = new ArrayList<>();

    // Constructors, Getters and Setters remain the same...
    public SchoolClass() {
        this.createdAt = LocalDateTime.now();
    }

    public SchoolClass(String className, String grade, String stream, String classTeacher, String roomNumber) {
        this();
        this.className = className;
        this.grade = grade;
        this.stream = stream;
        this.classTeacher = classTeacher;
        this.roomNumber = roomNumber;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }

    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }

    public String getStream() { return stream; }
    public void setStream(String stream) { this.stream = stream; }

    public String getClassTeacher() { return classTeacher; }
    public void setClassTeacher(String classTeacher) { this.classTeacher = classTeacher; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<Student> getStudents() { return students; }
    public void setStudents(List<Student> students) { this.students = students; }

    public List<ClassSchedule> getSchedules() { return schedules; }
    public void setSchedules(List<ClassSchedule> schedules) { this.schedules = schedules; }

    public List<AttendanceSession> getSessions() { return sessions; }
    public void setSessions(List<AttendanceSession> sessions) { this.sessions = sessions; }
}