package com.example.SM.controller;

import com.example.SM.dto.AttendanceResponse;
import com.example.SM.dto.FeePaymentResponse;
import com.example.SM.entity.Student;
import com.example.SM.service.AttendanceService;
import com.example.SM.service.FeePaymentService;
import com.example.SM.service.SchoolClassService;
import com.example.SM.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:3000")
public class DashboardController {
    
    @Autowired
    private StudentService studentService;
    
    @Autowired
    private FeePaymentService feePaymentService;
    
    @Autowired
    private AttendanceService attendanceService;
    
    @Autowired
    private SchoolClassService schoolClassService;
    
    @GetMapping("/summary")
    public ResponseEntity<?> getDashboardSummary() {
        try {
            System.out.println("🎯 DashboardController: Loading dashboard summary...");
            
            Map<String, Object> summary = new HashMap<>();
            
            // Get recent students (last 5 registered)
            List<Student> allStudents = studentService.getAllStudents();
            System.out.println("📊 Total students found: " + allStudents.size());
            
            List<Student> recentStudents = allStudents.stream()
                .sorted((s1, s2) -> {
                    if (s1.getRegistrationDate() == null || s2.getRegistrationDate() == null) {
                        return 0;
                    }
                    return s2.getRegistrationDate().compareTo(s1.getRegistrationDate());
                })
                .limit(5)
                .collect(Collectors.toList());
            summary.put("recentStudents", recentStudents);
            System.out.println("🎓 Recent students: " + recentStudents.size());
            
            // Get recent payments
            List<FeePaymentResponse> recentPayments = feePaymentService.getRecentPayments();
            summary.put("recentPayments", recentPayments);
            System.out.println("💰 Recent payments: " + recentPayments.size());
            
            // Get today's attendance - FIXED: Use getAttendanceByDate with today's date
            String today = LocalDate.now().toString();
            List<AttendanceResponse> todayAttendance = attendanceService.getAttendanceByDate(today);
            summary.put("todayAttendance", todayAttendance);
            System.out.println("📅 Today's attendance: " + todayAttendance.size());
            
            // Get statistics
            Map<String, Object> feeStats = feePaymentService.getFeeStatistics();
            summary.put("feeStatistics", feeStats);
            System.out.println("📈 Fee statistics loaded");
            
            // Get counts
            summary.put("totalStudents", allStudents.size());
            
            List<?> activeClasses = schoolClassService.getActiveClasses();
            summary.put("activeClassesCount", activeClasses.size());
            
            List<?> allClasses = schoolClassService.getAllClasses();
            summary.put("totalClassesCount", allClasses.size());
            
            // Get active sessions count
            List<?> activeSessions = attendanceService.getActiveSessions();
            summary.put("activeSessionsCount", activeSessions.size());
            
            System.out.println("✅ Dashboard summary loaded successfully");
            System.out.println("📋 Summary data: " + summary.keySet());
            
            return ResponseEntity.ok(summary);
            
        } catch (Exception e) {
            System.err.println("❌ DashboardController Error: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to load dashboard data: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    @GetMapping("/quick-stats")
    public ResponseEntity<?> getQuickStats() {
        try {
            System.out.println("🎯 DashboardController: Loading quick stats...");
            
            Map<String, Object> stats = new HashMap<>();
            
            // Basic counts for dashboard cards
            List<Student> allStudents = studentService.getAllStudents();
            List<?> activeClasses = schoolClassService.getActiveClasses();
            
            // FIXED: Use getAttendanceByDate instead of getTodayAttendance
            String today = LocalDate.now().toString();
            List<AttendanceResponse> todayAttendance = attendanceService.getAttendanceByDate(today);
            
            Map<String, Object> feeStats = feePaymentService.getFeeStatistics();
            
            stats.put("totalStudents", allStudents.size());
            stats.put("activeClasses", activeClasses.size());
            stats.put("todayAttendance", todayAttendance.size());
            stats.put("totalCollected", feeStats.get("totalCollected"));
            stats.put("pendingStudents", feeStats.get("pendingStudents"));
            stats.put("collectionRate", feeStats.get("collectionRate"));
            
            System.out.println("✅ Quick stats loaded: " + stats);
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            System.err.println("❌ Quick stats error: " + e.getMessage());
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to load quick stats: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    @GetMapping("/test")
    public ResponseEntity<?> testDashboard() {
        try {
            System.out.println("🎯 Dashboard test endpoint called");
            
            Map<String, Object> testData = new HashMap<>();
            testData.put("message", "Dashboard controller is working!");
            testData.put("status", "SUCCESS");
            testData.put("timestamp", java.time.LocalDateTime.now().toString());
            
            // Test individual services
            try {
                testData.put("studentService", "Available");
                int studentCount = studentService.getAllStudents().size();
                testData.put("studentCount", studentCount);
            } catch (Exception e) {
                testData.put("studentService", "Error: " + e.getMessage());
            }
            
            try {
                testData.put("feePaymentService", "Available");
                int paymentCount = feePaymentService.getRecentPayments().size();
                testData.put("paymentCount", paymentCount);
            } catch (Exception e) {
                testData.put("feePaymentService", "Error: " + e.getMessage());
            }
            
            try {
                testData.put("attendanceService", "Available");
                String today = LocalDate.now().toString();
                int attendanceCount = attendanceService.getAttendanceByDate(today).size();
                testData.put("attendanceCount", attendanceCount);
            } catch (Exception e) {
                testData.put("attendanceService", "Error: " + e.getMessage());
            }
            
            try {
                testData.put("schoolClassService", "Available");
                int classCount = schoolClassService.getActiveClasses().size();
                testData.put("classCount", classCount);
            } catch (Exception e) {
                testData.put("schoolClassService", "Error: " + e.getMessage());
            }
            
            return ResponseEntity.ok(testData);
            
        } catch (Exception e) {
            System.err.println("❌ Dashboard test error: " + e.getMessage());
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Dashboard test failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("service", "Dashboard Controller");
        response.put("status", "UP");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }
    
    // Additional dashboard endpoints
    @GetMapping("/attendance-today")
    public ResponseEntity<?> getTodayAttendance() {
        try {
            String today = LocalDate.now().toString();
            List<AttendanceResponse> attendance = attendanceService.getAttendanceByDate(today);
            return ResponseEntity.ok(attendance);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to load today's attendance: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    @GetMapping("/active-sessions")
    public ResponseEntity<?> getActiveSessions() {
        try {
            List<?> activeSessions = attendanceService.getActiveSessions();
            return ResponseEntity.ok(activeSessions);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to load active sessions: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
 // In DashboardController.java - ADD these public endpoints
    @GetMapping("/public/stats")
    public ResponseEntity<?> getPublicStats() {
        try {
            System.out.println("🎯 Public dashboard stats requested");
            
            Map<String, Object> stats = new HashMap<>();
            
            // Basic public statistics (no sensitive data)
            List<Student> allStudents = studentService.getAllStudents();
            List<?> activeClasses = schoolClassService.getActiveClasses();
            List<?> allClasses = schoolClassService.getAllClasses();
            
            stats.put("totalStudents", allStudents.size());
            stats.put("activeClasses", activeClasses.size());
            stats.put("totalClasses", allClasses.size());
            stats.put("serverTime", java.time.LocalDateTime.now().toString());
            stats.put("status", "SUCCESS");
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to load public stats: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}