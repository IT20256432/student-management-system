package com.example.SM.controller;

import com.example.SM.entity.SchoolClass;
import com.example.SM.service.SchoolClassService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/classes")
@CrossOrigin(origins = "*", maxAge = 3600) 
public class SchoolClassController {
    
    @Autowired
    private SchoolClassService schoolClassService;
    
    @GetMapping
    public List<SchoolClass> getAllClasses() {
        return schoolClassService.getAllClasses();
    }
    
    @GetMapping("/active")
    public List<SchoolClass> getActiveClasses() {
        return schoolClassService.getActiveClasses();
    }
    
    @GetMapping("/grade-test/{grade}")
    public ResponseEntity<?> testGradeEndpoint(@PathVariable String grade) {
        try {
            System.out.println("🧪 /api/classes/grade-test/{grade} called with grade: " + grade);
            
            String decodedGrade = URLDecoder.decode(grade, StandardCharsets.UTF_8.toString());
            
            Map<String, Object> response = new HashMap<>();
            response.put("originalParameter", grade);
            response.put("decodedGrade", decodedGrade);
            response.put("message", "Grade endpoint test successful");
            response.put("status", "SUCCESS");
            response.put("timestamp", LocalDateTime.now().toString());
            response.put("endpoint", "/api/classes/grade/{grade}");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("💥 Error in testGradeEndpoint: " + e.getMessage());
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Test failed: " + e.getMessage());
            errorResponse.put("parameter", grade);
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @GetMapping("/by-grade")
    public ResponseEntity<?> getClassesByGradeParam(@RequestParam String grade) {
        try {
            System.out.println("🎯 GET /api/classes/by-grade?grade=" + grade);
            
            // No need to decode - Spring does it automatically for @RequestParam
            String cleanGrade = grade.trim();
            System.out.println("🎯 Cleaned grade: " + cleanGrade);
            
            List<SchoolClass> classes = schoolClassService.getClassesByGrade(cleanGrade);
            
            Map<String, Object> response = new HashMap<>();
            response.put("grade", cleanGrade);
            response.put("classes", classes);
            response.put("count", classes.size());
            response.put("status", "SUCCESS");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("💥 Error in getClassesByGradeParam: " + e.getMessage());
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to fetch classes: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @GetMapping("/debug-info")
    public ResponseEntity<?> getDebugInfo() {
        try {
            List<SchoolClass> allClasses = schoolClassService.getAllClasses();
            
            Map<String, Object> response = new HashMap<>();
            response.put("totalClasses", allClasses.size());
            response.put("activeClasses", schoolClassService.getActiveClasses().size());
            
            // Use Collectors.toList() instead of toList()
            response.put("availableGrades", allClasses.stream()
                .map(SchoolClass::getGrade)
                .distinct()
                .collect(Collectors.toList()));
            
            // Use Collectors.toList() for sample classes
            response.put("sampleClasses", allClasses.stream()
                .limit(5)
                .map(c -> {
                    Map<String, Object> classInfo = new HashMap<>();
                    classInfo.put("id", c.getId());
                    classInfo.put("className", c.getClassName());
                    classInfo.put("grade", c.getGrade());
                    classInfo.put("active", c.isActive());
                    return classInfo;
                })
                .collect(Collectors.toList()));
            
            response.put("status", "SUCCESS");
            response.put("timestamp", LocalDateTime.now().toString());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Debug info failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SchoolClass> getClassById(@PathVariable Long id) {
        Optional<SchoolClass> schoolClass = schoolClassService.getClassById(id);
        return schoolClass.map(ResponseEntity::ok)
                         .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/grade/{grade:.+}")
    public ResponseEntity<?> getClassesByGrade(@PathVariable String grade) {
        try {
            System.out.println("🎯 GET /api/classes/grade/{grade} called");
            System.out.println("🔍 Raw grade parameter: " + grade);
            
            // Handle URL-safe encoding (A-L instead of A/L)
            String processedGrade = grade;
            
            // Convert A-L back to A/L
            if (grade.contains("-")) {
                processedGrade = grade.replace("-", "/");
                System.out.println("🔍 Converted - to /: " + processedGrade);
            }
            // Handle encoded slash
            else if (grade.contains("%2F") || grade.contains("%2f")) {
                processedGrade = URLDecoder.decode(grade, StandardCharsets.UTF_8.toString());
                System.out.println("🔍 Decoded %2F: " + processedGrade);
            }
            // Already has slash
            else if (grade.contains("/")) {
                processedGrade = grade;
                System.out.println("🔍 Already has slash: " + processedGrade);
            }
            
            processedGrade = processedGrade.trim();
            System.out.println("🎯 Final grade: " + processedGrade);
            
            List<SchoolClass> classes = schoolClassService.getClassesByGrade(processedGrade);
            System.out.println("✅ Found " + classes.size() + " classes");
            
            return ResponseEntity.ok(classes);
            
        } catch (Exception e) {
            System.err.println("💥 Error: " + e.getMessage());
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to fetch classes");
            errorResponse.put("grade", grade);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @PostMapping
    public ResponseEntity<?> createClass(@RequestBody SchoolClass schoolClass) {
        try {
            SchoolClass createdClass = schoolClassService.createClass(schoolClass);
            return ResponseEntity.ok(createdClass);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateClass(@PathVariable Long id, @RequestBody SchoolClass classDetails) {
        try {
            SchoolClass updatedClass = schoolClassService.updateClass(id, classDetails);
            return ResponseEntity.ok(updatedClass);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteClass(@PathVariable Long id) {
        try {
            schoolClassService.deleteClass(id);
            Map<String, Boolean> response = new HashMap<>();
            response.put("deleted", true);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivateClass(@PathVariable Long id) {
        try {
            SchoolClass deactivatedClass = schoolClassService.deactivateClass(id);
            return ResponseEntity.ok(deactivatedClass);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    
    @GetMapping("/grade-query")
    public ResponseEntity<?> getClassesByGradeQuery(@RequestParam String grade) {
        try {
            System.out.println("🔍 Query param - grade: " + grade);
            List<SchoolClass> classes = schoolClassService.getClassesByGrade(grade);
            return ResponseEntity.ok(classes);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to fetch classes: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    // Simple test endpoint to create sample data
    @PostMapping("/create-test-data")
    public ResponseEntity<?> createTestData() {
        try {
            List<SchoolClass> existingClasses = schoolClassService.getAllClasses();
            
            if (existingClasses.isEmpty()) {
                // Create sample classes for testing
                List<SchoolClass> testClasses = Arrays.asList(
                    new SchoolClass("A/L Mathematics", "A/L", "Science", "Math Teacher", "101"),
                    new SchoolClass("A/L Physics", "A/L", "Science", "Physics Teacher", "102"),
                    new SchoolClass("A/L Chemistry", "A/L", "Science", "Chemistry Teacher", "103"),
                    new SchoolClass("O/L Mathematics", "O/L", "General", "Math Teacher", "201"),
                    new SchoolClass("O/L Science", "O/L", "General", "Science Teacher", "202"),
                    new SchoolClass("Grade 10 English", "10", "General", "English Teacher", "301")
                );
                
                // Save all test classes
                for (SchoolClass cls : testClasses) {
                    schoolClassService.createClass(cls);
                }
                
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Created " + testClasses.size() + " test classes");
                response.put("classes", testClasses);
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Database already has " + existingClasses.size() + " classes");
                response.put("existingCount", existingClasses.size());
                return ResponseEntity.ok(response);
            }
            
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to create test data: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}