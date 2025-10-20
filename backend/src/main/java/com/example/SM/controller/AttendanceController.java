package com.example.SM.controller;

import com.example.SM.dto.AttendanceRequest;
import com.example.SM.dto.AttendanceResponse;
import com.example.SM.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "http://localhost:3000")
public class AttendanceController {
    
    @Autowired
    private AttendanceService attendanceService;
    
    @PostMapping("/record")
    public ResponseEntity<?> recordAttendance(@RequestBody AttendanceRequest request) {
        try {
            AttendanceResponse response = attendanceService.recordAttendance(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @GetMapping("/student/{studentId}")
    public List<AttendanceResponse> getStudentAttendance(@PathVariable String studentId) {
        return attendanceService.getStudentAttendance(studentId);
    }
    
    @GetMapping("/date/{date}")
    public List<AttendanceResponse> getAttendanceByDate(@PathVariable String date) {
        return attendanceService.getAttendanceByDate(date);
    }
    
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<?> getAttendanceBySession(@PathVariable Long sessionId) {
        try {
            List<AttendanceResponse> attendance = attendanceService.getAttendanceBySession(sessionId);
            return ResponseEntity.ok(attendance);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/student/{studentId}/summary")
    public AttendanceService.AttendanceSummary getAttendanceSummary(@PathVariable String studentId) {
        return attendanceService.getAttendanceSummary(studentId);
    }
    
    @PostMapping("/manual")
    public ResponseEntity<?> recordManualAttendance(
            @RequestParam String studentId,
            @RequestParam String date,
            @RequestParam String status,
            @RequestParam(required = false) Long sessionId) {
        try {
            LocalDate attendanceDate = LocalDate.parse(date);
            AttendanceResponse response = attendanceService.recordManualAttendance(studentId, attendanceDate, status, sessionId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    // REMOVED: getActiveSessions() method - This belongs in AttendanceSessionController
    
    @GetMapping("/today")
    public List<AttendanceResponse> getTodayAttendance() {
        String today = LocalDate.now().toString();
        return attendanceService.getAttendanceByDate(today);
    }
}