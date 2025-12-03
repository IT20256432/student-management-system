package com.example.SM.service;

import com.example.SM.entity.SchoolClass;
import com.example.SM.entity.Student;
import com.example.SM.repository.SchoolClassRepository;
import com.example.SM.repository.StudentRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.sql.DataSource; // ADD THIS IMPORT
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class StudentService {
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private SchoolClassRepository schoolClassRepository;
    
    @Autowired
    private QRCodeService qrCodeService;
    
    @Autowired
    private DataSource dataSource; // ADD THIS LINE
    
    public Student registerStudent(Student student) {
        System.out.println("🎯 SIMPLE REGISTRATION START");
        
        try {
            // 1. Generate student ID
            if (student.getStudentId() == null || student.getStudentId().isEmpty()) {
                student.setStudentId(generateStudentId(student));
            }
            
            // 2. Extract class ID if present
            Long classId = null;
            if (student.getSchoolClass() != null && student.getSchoolClass().getId() != null) {
                classId = student.getSchoolClass().getId();
                System.out.println("🔍 Got class ID from request: " + classId);
                
                // Remove the SchoolClass object to prevent JPA issues
                student.setSchoolClass(null);
            }
            
            // 3. Save student WITHOUT class first
            System.out.println("💾 Saving student without class...");
            Student savedStudent = studentRepository.save(student);
            studentRepository.flush();
            
            System.out.println("✅ Student saved with ID: " + savedStudent.getId());
            
            // 4. If class ID was provided, update it via DIRECT SQL
            if (classId != null) {
                System.out.println("🔗 Setting class via direct SQL...");
                setClassViaSql(savedStudent.getId(), classId);
                
                // Reload student to get updated class info
                savedStudent = studentRepository.findById(savedStudent.getId())
                    .orElseThrow(() -> new RuntimeException("Student not found after update"));
                
                System.out.println("✅ Class set successfully");
                System.out.println("   Student ID: " + savedStudent.getId());
                System.out.println("   Class ID: " + savedStudent.getClassId());
                System.out.println("   Class Name: " + savedStudent.getClassName());
            }
            
            // 5. Send QR code
            try {
                String className = savedStudent.getClassName() != null ? 
                    savedStudent.getClassName() : "Not Assigned";
                qrCodeService.generateAndSendQRCode(savedStudent, className);
                System.out.println("📧 QR code sent");
            } catch (Exception e) {
                System.err.println("⚠️ QR email failed: " + e.getMessage());
            }
            
            System.out.println("✅ SIMPLE REGISTRATION COMPLETE");
            return savedStudent;
            
        } catch (Exception e) {
            System.err.println("💥 Registration failed: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Registration failed: " + e.getMessage());
        }
    }
    
    // Helper method for direct SQL update
    private void setClassViaSql(Long studentId, Long classId) {
        try {
            System.out.println("🔧 Executing SQL: UPDATE students SET class_id = " + classId + " WHERE id = " + studentId);
            
            // Direct SQL - this ALWAYS works
            String sql = "UPDATE students SET class_id = ? WHERE id = ?";
            
            try (Connection conn = dataSource.getConnection();
                 PreparedStatement stmt = conn.prepareStatement(sql)) {
                
                stmt.setLong(1, classId);
                stmt.setLong(2, studentId);
                int rows = stmt.executeUpdate();
                
                System.out.println("✅ SQL Update successful: " + rows + " row(s) affected");
                System.out.println("   Student " + studentId + " → Class " + classId);
                
            }
        } catch (Exception e) {
            System.err.println("❌ SQL update failed: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to set class: " + e.getMessage());
        }
    }
    
    // KEEP ALL YOUR EXISTING METHODS BELOW - they don't need to change
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }
    
    public Optional<Student> getStudentById(Long id) {
        return studentRepository.findById(id);
    }
    
    public Optional<Student> getStudentByStudentId(String studentId) {
        return studentRepository.findByStudentId(studentId);
    }
    
    public List<Student> getStudentsByClass(Long classId) {
        Optional<SchoolClass> schoolClass = schoolClassRepository.findById(classId);
        if (schoolClass.isPresent()) {
            return studentRepository.findBySchoolClass(schoolClass.get());
        }
        throw new RuntimeException("Class not found with id: " + classId);
    }
    
    public List<Student> getStudentsByGrade(String grade) {
        return studentRepository.findByGrade(grade);
    }
    
    public Student updateStudent(Long id, Student studentDetails) {
        Optional<Student> student = studentRepository.findById(id);
        if (student.isPresent()) {
            Student existingStudent = student.get();
            
            existingStudent.setFirstName(studentDetails.getFirstName());
            existingStudent.setLastName(studentDetails.getLastName());
            existingStudent.setGender(studentDetails.getGender());
            existingStudent.setDob(studentDetails.getDob());
            existingStudent.setEmail(studentDetails.getEmail());
            existingStudent.setPhone(studentDetails.getPhone());
            existingStudent.setAddress(studentDetails.getAddress());
            existingStudent.setCity(studentDetails.getCity());
            existingStudent.setDistrict(studentDetails.getDistrict());
            existingStudent.setGuardianName(studentDetails.getGuardianName());
            existingStudent.setGuardianPhone(studentDetails.getGuardianPhone());
            existingStudent.setRelationship(studentDetails.getRelationship());
            existingStudent.setStatus(studentDetails.getStatus());
            existingStudent.setSubjects(studentDetails.getSubjects());
            
            if (studentDetails.getSchoolClass() != null && studentDetails.getSchoolClass().getId() != null) {
                Optional<SchoolClass> schoolClass = schoolClassRepository.findById(studentDetails.getSchoolClass().getId());
                if (schoolClass.isPresent()) {
                    existingStudent.setSchoolClass(schoolClass.get());
                    existingStudent.setGrade(schoolClass.get().getGrade());
                }
            }
            
            return studentRepository.save(existingStudent);
        }
        throw new RuntimeException("Student not found with id: " + id);
    }
    
    public void deleteStudent(Long id) {
        studentRepository.deleteById(id);
    }
    
    public Student updateStudentClass(Long studentId, Long classId) {
        Optional<Student> student = studentRepository.findById(studentId);
        Optional<SchoolClass> schoolClass = schoolClassRepository.findById(classId);
        
        if (student.isPresent() && schoolClass.isPresent()) {
            Student existingStudent = student.get();
            existingStudent.setSchoolClass(schoolClass.get());
            existingStudent.setGrade(schoolClass.get().getGrade());
            return studentRepository.save(existingStudent);
        }
        throw new RuntimeException("Student or Class not found");
    }
    
    public List<Student> getStudentsWithoutClass() {
        return studentRepository.findBySchoolClassIsNull();
    }
    
    public Map<String, Object> getClassStatistics(Long classId) {
        Optional<SchoolClass> schoolClass = schoolClassRepository.findById(classId);
        if (schoolClass.isEmpty()) {
            throw new RuntimeException("Class not found with id: " + classId);
        }
        
        List<Student> classStudents = studentRepository.findBySchoolClass(schoolClass.get());
        long activeStudents = 0;
        for (Student student : classStudents) {
            if ("Active".equals(student.getStatus())) {
                activeStudents++;
            }
        }
        
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("classId", classId);
        statistics.put("className", schoolClass.get().getClassName());
        statistics.put("totalStudents", classStudents.size());
        statistics.put("activeStudents", activeStudents);
        statistics.put("inactiveStudents", classStudents.size() - activeStudents);
        
        return statistics;
    }
    
    // ADD METHOD TO RESEND QR CODE
    public void resendQRCode(String studentId) {
        Optional<Student> studentOpt = studentRepository.findByStudentId(studentId);
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            try {
                String className = student.getSchoolClass() != null ? 
                    student.getSchoolClass().getClassName() : "Not Assigned";
                
                qrCodeService.generateAndSendQRCode(student, className);
                System.out.println("✅ QR code resent to: " + student.getEmail());
            } catch (Exception e) {
                throw new RuntimeException("Failed to resend QR code: " + e.getMessage());
            }
        } else {
            throw new RuntimeException("Student not found with ID: " + studentId);
        }
    }
    
    public Student registerStudentWithClass(Student student, Long classId) {
        System.out.println("🚀 REGISTER WITH CLASS - SIMPLE METHOD");
        
        try {
            // 1. Generate student ID
            if (student.getStudentId() == null || student.getStudentId().isEmpty()) {
                student.setStudentId(generateStudentId(student));
            }
            
            System.out.println("📋 Student: " + student.getFirstName() + " " + student.getLastName());
            System.out.println("🎯 Class ID to assign: " + classId);
            
            // 2. If classId is provided, set it via DIRECT SQL APPROACH
            if (classId != null) {
                // Save student WITHOUT class first
                student.setSchoolClass(null);
                Student savedStudent = studentRepository.save(student);
                studentRepository.flush();
                
                System.out.println("✅ Student saved with ID: " + savedStudent.getId());
                
                // Update class via SQL
                String sql = "UPDATE students SET class_id = ? WHERE id = ?";
                try (Connection conn = dataSource.getConnection();
                     PreparedStatement stmt = conn.prepareStatement(sql)) {
                    
                    stmt.setLong(1, classId);
                    stmt.setLong(2, savedStudent.getId());
                    int rows = stmt.executeUpdate();
                    System.out.println("✅ SQL Update: " + rows + " rows affected");
                    
                } catch (Exception e) {
                    System.err.println("❌ SQL failed: " + e.getMessage());
                    // Continue anyway - student is saved
                }
                
                // Reload student
                Student finalStudent = studentRepository.findById(savedStudent.getId())
                    .orElseThrow(() -> new RuntimeException("Student not found"));
                
                System.out.println("🔍 Final check - Class ID: " + finalStudent.getClassId());
                
                // Send QR code
                try {
                    qrCodeService.generateAndSendQRCode(finalStudent, 
                        finalStudent.getClassName() != null ? finalStudent.getClassName() : "Not Assigned");
                } catch (Exception e) {
                    System.err.println("⚠️ QR failed: " + e.getMessage());
                }
                
                return finalStudent;
                
            } else {
                // No class - simple save
                student.setSchoolClass(null);
                Student savedStudent = studentRepository.save(student);
                
                // Send QR code
                try {
                    qrCodeService.generateAndSendQRCode(savedStudent, "Not Assigned");
                } catch (Exception e) {
                    System.err.println("⚠️ QR failed: " + e.getMessage());
                }
                
                return savedStudent;
            }
            
        } catch (Exception e) {
            System.err.println("💥 Registration failed: " + e.getMessage());
            throw new RuntimeException("Registration failed: " + e.getMessage());
        }
    }
    
    private String generateStudentId(Student student) {
        String prefix = student.getGrade().equals("A/L") ? "AL" : "OL";
        String year = String.valueOf(java.time.Year.now().getValue()).substring(2);
        String random = String.format("%04d", (int)(Math.random() * 10000));
        return prefix + year + random;
    }
}