package com.example.SM.controller;

import com.example.SM.entity.Student;
import com.example.SM.entity.SchoolClass;
import com.example.SM.repository.StudentRepository;
import com.example.SM.repository.SchoolClassRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/debug/students")
@CrossOrigin(origins = "http://localhost:3000")
public class StudentDebugController {
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private SchoolClassRepository schoolClassRepository;
    
    @GetMapping("/{id}/raw")
    public ResponseEntity<?> getStudentRaw(@PathVariable Long id) {
        try {
            // 1. Get student with class using repository
            Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
            
            Map<String, Object> response = new HashMap<>();
            response.put("studentId", student.getId());
            response.put("studentName", student.getFirstName() + " " + student.getLastName());
            response.put("grade", student.getGrade());
            response.put("email", student.getEmail());
            
            // 2. Check if schoolClass is loaded
            response.put("schoolClassLoaded", student.getSchoolClass() != null);
            
            if (student.getSchoolClass() != null) {
                response.put("classId", student.getSchoolClass().getId());
                response.put("className", student.getSchoolClass().getClassName());
            } else {
                response.put("classId", null);
                response.put("className", null);
            }
            
            // 3. Direct SQL check (alternative approach)
            response.put("hasSchoolClassField", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/class/{id}/exists")
    public ResponseEntity<?> checkClassExists(@PathVariable Long id) {
        try {
            boolean exists = schoolClassRepository.existsById(id);
            if (exists) {
                SchoolClass schoolClass = schoolClassRepository.findById(id).orElse(null);
                return ResponseEntity.ok(Map.of(
                    "exists", true,
                    "id", id,
                    "className", schoolClass != null ? schoolClass.getClassName() : "null",
                    "grade", schoolClass != null ? schoolClass.getGrade() : "null"
                ));
            } else {
                return ResponseEntity.ok(Map.of("exists", false, "id", id));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}