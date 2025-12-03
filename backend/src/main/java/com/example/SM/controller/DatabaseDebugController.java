package com.example.SM.controller;

import com.example.SM.service.DatabaseDebugService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/debug/db")
@CrossOrigin(origins = "http://localhost:3000")
public class DatabaseDebugController {
    
    @Autowired
    private DatabaseDebugService databaseDebugService;
    
    @GetMapping("/student/{id}")
    public ResponseEntity<?> debugStudent(@PathVariable Long id) {
        try {
            System.out.println("🎯 DEBUG: Checking student ID " + id + " in database");
            Map<String, Object> result = databaseDebugService.checkStudent(id);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/class/{id}")
    public ResponseEntity<?> debugClass(@PathVariable Long id) {
        try {
            System.out.println("🎯 DEBUG: Checking class ID " + id + " in database");
            Map<String, Object> result = databaseDebugService.checkClass(id);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/table/{tableName}")
    public ResponseEntity<?> debugTableStructure(@PathVariable String tableName) {
        try {
            System.out.println("🎯 DEBUG: Checking table structure for " + tableName);
            Map<String, Object> result = databaseDebugService.checkTableStructure(tableName);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/students/recent")
    public ResponseEntity<?> getRecentStudents() {
        try {
            System.out.println("🎯 DEBUG: Getting recent students from database");
            Map<String, Object> result = databaseDebugService.getRecentStudents();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/test/create")
    public ResponseEntity<?> createTestStudent(@RequestBody Map<String, Object> request) {
        try {
            Long classId = request.get("classId") != null ? 
                Long.parseLong(request.get("classId").toString()) : null;
            
            System.out.println("🧪 DEBUG: Creating test student with classId: " + classId);
            Map<String, Object> result = databaseDebugService.createTestStudent(classId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "healthy");
            response.put("service", "Database Debug Service");
            response.put("timestamp", java.time.LocalDateTime.now().toString());
            response.put("endpoints", Map.of(
                "checkStudent", "GET /api/debug/db/student/{id}",
                "checkClass", "GET /api/debug/db/class/{id}",
                "tableStructure", "GET /api/debug/db/table/{tableName}",
                "recentStudents", "GET /api/debug/db/students/recent",
                "createTest", "POST /api/debug/db/test/create"
            ));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}