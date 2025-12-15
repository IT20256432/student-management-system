package com.example.SM.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
@CrossOrigin(origins = "*")
public class TestController {

	 @GetMapping("/public")
	    public ResponseEntity<?> publicEndpoint() {
	        Map<String, String> response = new HashMap<>();
	        response.put("message", "This is a public endpoint");
	        response.put("status", "No authentication required");
	        response.put("timestamp", java.time.LocalDateTime.now().toString());
	        return ResponseEntity.ok(response);
	    }

	    @GetMapping("/protected")
	    public ResponseEntity<?> protectedEndpoint() {
	        Map<String, Object> response = new HashMap<>();
	        response.put("message", "This is a protected endpoint");
	        response.put("status", "You are authenticated!");
	        response.put("timestamp", java.time.LocalDateTime.now().toString());
	        return ResponseEntity.ok(response);
	    }
    
    @GetMapping("/students")
    public ResponseEntity<?> getAllStudents() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Students list");
        response.put("students", new String[]{"Alice", "Bob", "Charlie"});
        response.put("total", 3);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/classes")
    public ResponseEntity<?> getAllClasses() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Classes list");
        response.put("classes", new String[]{"Math", "Science", "History"});
        response.put("total", 3);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Dashboard data");
        response.put("stats", Map.of(
            "totalStudents", 150,
            "totalTeachers", 15,
            "totalClasses", 12,
            "activeUsers", 165
        ));
        return ResponseEntity.ok(response);
    }
}