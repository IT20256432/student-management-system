package com.example.SM.controller;

import com.example.SM.entity.Student;
import com.example.SM.entity.SchoolClass;
import com.example.SM.service.StudentService;
import com.example.SM.service.SchoolClassService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "http://localhost:3000")
public class StudentController {
    
    @Autowired
    private StudentService studentService;
    
    @Autowired
    private SchoolClassService schoolClassService;
    
    @PostMapping("/register")
    public ResponseEntity<?> registerStudent(@RequestBody Student student) {
        try {
            if (student.getSchoolClass() != null && student.getSchoolClass().getId() != null) {
                Optional<SchoolClass> schoolClass = schoolClassService.getClassById(student.getSchoolClass().getId());
                if (schoolClass.isEmpty()) {
                    Map<String, String> errorResponse = new HashMap<>();
                    errorResponse.put("error", "Invalid class ID: " + student.getSchoolClass().getId());
                    return ResponseEntity.badRequest().body(errorResponse);
                }
                student.setSchoolClass(schoolClass.get());
                
                if (!student.getGrade().equals(schoolClass.get().getGrade())) {
                    Map<String, String> errorResponse = new HashMap<>();
                    errorResponse.put("error", "Student grade (" + student.getGrade() + 
                                      ") must match class grade (" + schoolClass.get().getGrade() + ")");
                    return ResponseEntity.badRequest().body(errorResponse);
                }
            }
            
            Student registeredStudent = studentService.registerStudent(student);
            return ResponseEntity.ok(registeredStudent);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }


    @GetMapping("/recent")
    public List<Student> getRecentStudents() {
        List<Student> allStudents = studentService.getAllStudents();
        // Return last 5 registered students
        return allStudents.stream()
                .sorted((s1, s2) -> s2.getRegistrationDate().compareTo(s1.getRegistrationDate()))
                .limit(5)
                .collect(Collectors.toList());
    }
    
    @GetMapping
    public List<Student> getAllStudents() {
        return studentService.getAllStudents();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudentById(@PathVariable Long id) {
        Optional<Student> student = studentService.getStudentById(id);
        return student.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/student-id/{studentId}")
    public ResponseEntity<Student> getStudentByStudentId(@PathVariable String studentId) {
        Optional<Student> student = studentService.getStudentByStudentId(studentId);
        return student.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/class/{classId}")
    public ResponseEntity<List<Student>> getStudentsByClass(@PathVariable Long classId) {
        try {
            List<Student> students = studentService.getStudentsByClass(classId);
            return ResponseEntity.ok(students);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/grade/{grade}")
    public List<Student> getStudentsByGrade(@PathVariable String grade) {
        return studentService.getStudentsByGrade(grade);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateStudent(@PathVariable Long id, @RequestBody Student studentDetails) {
        try {
            if (studentDetails.getSchoolClass() != null && studentDetails.getSchoolClass().getId() != null) {
                Optional<SchoolClass> schoolClass = schoolClassService.getClassById(studentDetails.getSchoolClass().getId());
                if (schoolClass.isEmpty()) {
                    Map<String, String> errorResponse = new HashMap<>();
                    errorResponse.put("error", "Invalid class ID: " + studentDetails.getSchoolClass().getId());
                    return ResponseEntity.badRequest().body(errorResponse);
                }
                studentDetails.setSchoolClass(schoolClass.get());
            }
            
            Student updatedStudent = studentService.updateStudent(id, studentDetails);
            return ResponseEntity.ok(updatedStudent);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    @PutMapping("/{studentId}/class/{classId}")
    public ResponseEntity<?> updateStudentClass(
            @PathVariable Long studentId, 
            @PathVariable Long classId) {
        try {
            Student updatedStudent = studentService.updateStudentClass(studentId, classId);
            return ResponseEntity.ok(updatedStudent);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteStudent(@PathVariable Long id) {
        try {
            studentService.deleteStudent(id);
            Map<String, Boolean> response = new HashMap<>();
            response.put("deleted", true);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/unassigned")
    public List<Student> getStudentsWithoutClass() {
        return studentService.getStudentsWithoutClass();
    }
    
    @GetMapping("/class/{classId}/statistics")
    public ResponseEntity<?> getClassStatistics(@PathVariable Long classId) {
        try {
            Map<String, Object> statistics = studentService.getClassStatistics(classId);
            return ResponseEntity.ok(statistics);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}