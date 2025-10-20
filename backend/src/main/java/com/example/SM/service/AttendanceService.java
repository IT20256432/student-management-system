package com.example.SM.service;

import com.example.SM.entity.Attendance;
import com.example.SM.entity.Student;
import com.example.SM.entity.AttendanceSession;
import com.example.SM.dto.AttendanceRequest;
import com.example.SM.dto.AttendanceResponse;
import com.example.SM.repository.AttendanceRepository;
import com.example.SM.repository.StudentRepository;
import com.example.SM.repository.AttendanceSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private AttendanceSessionRepository attendanceSessionRepository;
    
    public AttendanceResponse recordAttendance(AttendanceRequest request) {
        Optional<Student> studentOpt = studentRepository.findByStudentId(request.getStudentId());
        if (studentOpt.isEmpty()) {
            throw new RuntimeException("Student not found with ID: " + request.getStudentId());
        }
        
        Student student = studentOpt.get();
        LocalDate attendanceDate = request.getDate() != null ? 
            LocalDate.parse(request.getDate()) : LocalDate.now();
        
        if (request.getSessionId() == null) {
            throw new RuntimeException("Attendance session is required");
        }
        
        Optional<AttendanceSession> sessionOpt = attendanceSessionRepository.findById(request.getSessionId());
        if (sessionOpt.isEmpty()) {
            throw new RuntimeException("Invalid attendance session");
        }
        
        AttendanceSession session = sessionOpt.get();
        
        if (session.getStatus() != AttendanceSession.SessionStatus.ACTIVE) {
            throw new RuntimeException("Attendance session is not active. Current status: " + session.getStatus());
        }
        
        LocalTime currentTime = LocalTime.now();
        if (currentTime.isBefore(session.getScheduledStartTime()) || 
            currentTime.isAfter(session.getScheduledEndTime())) {
            throw new RuntimeException("Attendance can only be recorded during session hours: " + 
                session.getScheduledStartTime() + " - " + session.getScheduledEndTime());
        }
        
        if (student.getSchoolClass() == null) {
            throw new RuntimeException("Student is not assigned to any class");
        }
        
        if (!student.getSchoolClass().getId().equals(session.getSchoolClass().getId())) {
            throw new RuntimeException("Student belongs to " + student.getSchoolClass().getClassName() + 
                ", but this session is for " + session.getSchoolClass().getClassName());
        }
        
        if (attendanceRepository.existsByStudentIdAndAttendanceSession(request.getStudentId(), session)) {
            throw new RuntimeException("Attendance already recorded for student " + 
                request.getStudentId() + " in this session");
        }
        
        String status = determineAttendanceStatus(LocalDateTime.now(), session.getScheduledStartTime());
        
        Attendance attendance = new Attendance();
        attendance.setStudentId(student.getStudentId());
        attendance.setStudentName(student.getFirstName() + " " + student.getLastName());
        attendance.setGrade(student.getGrade());
        attendance.setAttendanceDate(attendanceDate);
        attendance.setScanTime(LocalDateTime.now());
        attendance.setStatus(status);
        attendance.setScanMethod("QR");
        attendance.setAttendanceSession(session);
        
        Attendance savedAttendance = attendanceRepository.save(attendance);
        
        return convertToResponse(savedAttendance);
    }
    
    public List<AttendanceResponse> getStudentAttendance(String studentId) {
        List<Attendance> attendanceRecords = attendanceRepository
            .findByStudentIdOrderByAttendanceDateDesc(studentId);
        
        return attendanceRecords.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    public List<AttendanceResponse> getAttendanceByDate(String date) {
        LocalDate attendanceDate = LocalDate.parse(date);
        List<Attendance> attendanceRecords = attendanceRepository
            .findByAttendanceDateOrderByScanTimeAsc(attendanceDate);
        
        return attendanceRecords.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    public List<AttendanceResponse> getAttendanceBySession(Long sessionId) {
        Optional<AttendanceSession> session = attendanceSessionRepository.findById(sessionId);
        if (session.isEmpty()) {
            throw new RuntimeException("Session not found");
        }
        
        List<Attendance> attendanceRecords = attendanceRepository
            .findBySessionId(sessionId);
        
        return attendanceRecords.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    public AttendanceSummary getAttendanceSummary(String studentId) {
        Long totalPresent = attendanceRepository.countPresentDaysByStudentId(studentId);
        Long totalDays = (long) attendanceRepository.findByStudentIdOrderByAttendanceDateDesc(studentId).size();
        
        double attendancePercentage = totalDays > 0 ? (double) totalPresent / totalDays * 100 : 0;
        
        return new AttendanceSummary(studentId, totalPresent, totalDays - totalPresent, 
                                   totalDays, attendancePercentage);
    }
    
    public AttendanceResponse recordManualAttendance(String studentId, LocalDate date, String status, Long sessionId) {
        Optional<Student> studentOpt = studentRepository.findByStudentId(studentId);
        if (studentOpt.isEmpty()) {
            throw new RuntimeException("Student not found with ID: " + studentId);
        }
        
        Student student = studentOpt.get();
        
        if (sessionId != null) {
            Optional<AttendanceSession> sessionOpt = attendanceSessionRepository.findById(sessionId);
            if (sessionOpt.isEmpty()) {
                throw new RuntimeException("Invalid attendance session");
            }
            
            AttendanceSession session = sessionOpt.get();
            
            if (student.getSchoolClass() == null || 
                !student.getSchoolClass().getId().equals(session.getSchoolClass().getId())) {
                throw new RuntimeException("Student does not belong to this class session");
            }
        }
        
        Optional<Attendance> existing;
        if (sessionId != null) {
            Optional<AttendanceSession> session = attendanceSessionRepository.findById(sessionId);
            existing = session.isPresent() ? 
                attendanceRepository.findByStudentIdAndAttendanceSession(studentId, session.get()) : 
                attendanceRepository.findByStudentIdAndAttendanceDate(studentId, date);
        } else {
            existing = attendanceRepository.findByStudentIdAndAttendanceDate(studentId, date);
        }
        
        Attendance attendance;
        if (existing.isPresent()) {
            attendance = existing.get();
            attendance.setStatus(status);
            if (sessionId != null) {
                Optional<AttendanceSession> session = attendanceSessionRepository.findById(sessionId);
                session.ifPresent(attendance::setAttendanceSession);
            }
        } else {
            attendance = new Attendance();
            attendance.setStudentId(studentId);
            attendance.setStudentName(student.getFirstName() + " " + student.getLastName());
            attendance.setGrade(student.getGrade());
            attendance.setAttendanceDate(date);
            attendance.setScanTime(LocalDateTime.now());
            attendance.setStatus(status);
            attendance.setScanMethod("MANUAL");
            if (sessionId != null) {
                Optional<AttendanceSession> session = attendanceSessionRepository.findById(sessionId);
                session.ifPresent(attendance::setAttendanceSession);
            }
        }
        
        Attendance savedAttendance = attendanceRepository.save(attendance);
        return convertToResponse(savedAttendance);
    }
    
    public List<AttendanceSession> getActiveSessions() {
        return attendanceSessionRepository.findTodayActiveSessions();
    }
    
    private String determineAttendanceStatus(LocalDateTime scanTime, LocalTime sessionStartTime) {
        LocalTime lateThreshold = sessionStartTime.plusMinutes(15);
        return scanTime.toLocalTime().isAfter(lateThreshold) ? "LATE" : "PRESENT";
    }
    
    private AttendanceResponse convertToResponse(Attendance attendance) {
        AttendanceResponse response = new AttendanceResponse();
        response.setId(attendance.getId());
        response.setStudentId(attendance.getStudentId());
        response.setStudentName(attendance.getStudentName());
        response.setGrade(attendance.getGrade());
        response.setAttendanceDate(attendance.getAttendanceDate());
        response.setScanTime(attendance.getScanTime());
        response.setStatus(attendance.getStatus());
        response.setScanMethod(attendance.getScanMethod());
        response.setCreatedAt(attendance.getCreatedAt());
        
        if (attendance.getAttendanceSession() != null) {
            response.setSessionId(attendance.getAttendanceSession().getId());
            response.setSubject(attendance.getAttendanceSession().getSubject());
            response.setClassName(attendance.getAttendanceSession().getSchoolClass().getClassName());
        }
        
        return response;
    }
    
    public static class AttendanceSummary {
        private String studentId;
        private Long presentDays;
        private Long absentDays;
        private Long totalDays;
        private Double attendancePercentage;
        
        public AttendanceSummary(String studentId, Long presentDays, Long absentDays, 
                               Long totalDays, Double attendancePercentage) {
            this.studentId = studentId;
            this.presentDays = presentDays;
            this.absentDays = absentDays;
            this.totalDays = totalDays;
            this.attendancePercentage = attendancePercentage;
        }
        
        public String getStudentId() { return studentId; }
        public void setStudentId(String studentId) { this.studentId = studentId; }
        
        public Long getPresentDays() { return presentDays; }
        public void setPresentDays(Long presentDays) { this.presentDays = presentDays; }
        
        public Long getAbsentDays() { return absentDays; }
        public void setAbsentDays(Long absentDays) { this.absentDays = absentDays; }
        
        public Long getTotalDays() { return totalDays; }
        public void setTotalDays(Long totalDays) { this.totalDays = totalDays; }
        
        public Double getAttendancePercentage() { return attendancePercentage; }
        public void setAttendancePercentage(Double attendancePercentage) { this.attendancePercentage = attendancePercentage; }
    }
}