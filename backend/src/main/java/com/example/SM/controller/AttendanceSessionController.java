package com.example.SM.controller;

import com.example.SM.entity.AttendanceSession;
import com.example.SM.service.AttendanceSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance/sessions")
@CrossOrigin(origins = "http://localhost:3000")
public class AttendanceSessionController {
    
    @Autowired
    private AttendanceSessionService attendanceSessionService;
    
    @GetMapping("/active")
    public List<AttendanceSession> getActiveSessions() {
        return attendanceSessionService.getActiveSessions();
    }
    
    @GetMapping("/class/{classId}")
    public List<AttendanceSession> getSessionsByClassAndDate(
            @PathVariable Long classId,
            @RequestParam(required = false) String date) {
        
        LocalDate targetDate = date != null ? LocalDate.parse(date) : LocalDate.now();
        return attendanceSessionService.getSessionsByClassAndDate(classId, targetDate);
    }
    
    @PostMapping
    public ResponseEntity<?> createSession(@RequestBody AttendanceSession session) {
        try {
            AttendanceSession createdSession = attendanceSessionService.createSession(session);
            return ResponseEntity.ok(createdSession);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @PostMapping("/{sessionId}/start")
    public ResponseEntity<?> startSession(@PathVariable Long sessionId) {
        try {
            AttendanceSession session = attendanceSessionService.startSession(sessionId);
            return ResponseEntity.ok(session);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    @PostMapping("/{sessionId}/end")
    public ResponseEntity<?> endSession(@PathVariable Long sessionId) {
        try {
            AttendanceSession session = attendanceSessionService.endSession(sessionId);
            return ResponseEntity.ok(session);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/today")
    public List<AttendanceSession> getTodaySessions() {
        return attendanceSessionService.getSessionsByClassAndDate(null, LocalDate.now());
    }
}