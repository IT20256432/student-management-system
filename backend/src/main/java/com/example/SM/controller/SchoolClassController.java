package com.example.SM.controller;

import com.example.SM.entity.SchoolClass;
import com.example.SM.service.SchoolClassService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/classes")
@CrossOrigin(origins = "http://localhost:3000")
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
    
    @GetMapping("/grade/{grade}")
    public List<SchoolClass> getClassesByGrade(@PathVariable String grade) {
        return schoolClassService.getClassesByGrade(grade);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SchoolClass> getClassById(@PathVariable Long id) {
        Optional<SchoolClass> schoolClass = schoolClassService.getClassById(id);
        return schoolClass.map(ResponseEntity::ok)
                         .orElse(ResponseEntity.notFound().build());
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
    
    
}