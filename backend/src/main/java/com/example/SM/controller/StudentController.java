package com.example.SM.controller;

import com.example.SM.entity.Student;
import com.example.SM.entity.SchoolClass;
import com.example.SM.service.StudentService;
import com.example.SM.service.SchoolClassService;
import com.example.SM.service.EmailService;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.gson.Gson;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = {"http://localhost:3000"})
public class StudentController {
    
    @Autowired
    private StudentService studentService;
    
    @Autowired
    private SchoolClassService schoolClassService;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private DataSource dataSource;
    
    // UPDATED: This method now handles QR generation and email
    @PostMapping("/register-direct")
    public ResponseEntity<?> registerStudentDirect(@RequestBody Map<String, Object> request) {
        try {
            System.out.println("🚀 DIRECT REGISTRATION START");
            
            // Extract data
            String firstName = (String) request.get("firstName");
            String lastName = (String) request.get("lastName");
            String email = (String) request.get("email");
            String grade = (String) request.get("grade");
            String phone = request.get("phone") != null ? (String) request.get("phone") : "";
            String address = request.get("address") != null ? (String) request.get("address") : "";
            String city = request.get("city") != null ? (String) request.get("city") : "";
            String district = request.get("district") != null ? (String) request.get("district") : "";
            String gender = request.get("gender") != null ? (String) request.get("gender") : "";
            String dob = request.get("dob") != null ? (String) request.get("dob") : null;
            String guardianName = request.get("guardianName") != null ? (String) request.get("guardianName") : "";
            String guardianPhone = request.get("guardianPhone") != null ? (String) request.get("guardianPhone") : "";
            String relationship = request.get("relationship") != null ? (String) request.get("relationship") : "";
            
            Long classId = null;
            if (request.get("classId") != null) {
                classId = ((Number) request.get("classId")).longValue();
            }
            
            // Generate student ID
            String prefix = "A/L".equals(grade) ? "AL" : "OL";
            String year = String.valueOf(java.time.Year.now().getValue()).substring(2);
            String random = String.format("%04d", (int)(Math.random() * 10000));
            String studentId = prefix + year + random;
            
            System.out.println("📋 Data for insertion:");
            System.out.println("   Name: " + firstName + " " + lastName);
            System.out.println("   Student ID: " + studentId);
            System.out.println("   Class ID: " + classId);
            System.out.println("   Email: " + email);
            System.out.println("   Grade: " + grade);
            
            // DIRECT SQL INSERT
            String sql = "INSERT INTO students (" +
                        "student_id, first_name, last_name, grade, email, " +
                        "phone, address, city, district, gender, " +
                        "dob, guardian_name, guardian_phone, relationship, " +
                        "class_id, status, registration_date, created_at" +
                        ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', CURDATE(), NOW())";
            
            Long newStudentId = null;
            String className = "Not Assigned";
            
            try (Connection conn = dataSource.getConnection();
                 PreparedStatement stmt = conn.prepareStatement(sql, PreparedStatement.RETURN_GENERATED_KEYS)) {
                
                // Set parameters
                int paramIndex = 1;
                stmt.setString(paramIndex++, studentId);
                stmt.setString(paramIndex++, firstName);
                stmt.setString(paramIndex++, lastName);
                stmt.setString(paramIndex++, grade);
                stmt.setString(paramIndex++, email);
                stmt.setString(paramIndex++, phone);
                stmt.setString(paramIndex++, address);
                stmt.setString(paramIndex++, city);
                stmt.setString(paramIndex++, district);
                stmt.setString(paramIndex++, gender);
                
                // Handle dob (Date)
                if (dob != null && !dob.isEmpty()) {
                    stmt.setDate(paramIndex++, java.sql.Date.valueOf(dob));
                } else {
                    stmt.setNull(paramIndex++, java.sql.Types.DATE);
                }
                
                // Guardian info
                stmt.setString(paramIndex++, guardianName);
                stmt.setString(paramIndex++, guardianPhone);
                stmt.setString(paramIndex++, relationship);
                
                // Class ID
                if (classId != null) {
                    stmt.setLong(paramIndex++, classId);
                } else {
                    stmt.setNull(paramIndex++, java.sql.Types.BIGINT);
                }
                
                int rows = stmt.executeUpdate();
                
                if (rows > 0) {
                    ResultSet keys = stmt.getGeneratedKeys();
                    if (keys.next()) {
                        newStudentId = keys.getLong(1);
                        System.out.println("✅ DIRECT SQL: Student created with ID: " + newStudentId);
                        
                        // Load the class name for response
                        if (classId != null) {
                            try {
                                String classSql = "SELECT class_name FROM school_classes WHERE id = ?";
                                try (PreparedStatement classStmt = conn.prepareStatement(classSql)) {
                                    classStmt.setLong(1, classId);
                                    ResultSet classRs = classStmt.executeQuery();
                                    if (classRs.next()) {
                                        className = classRs.getString("class_name");
                                    }
                                }
                            } catch (Exception e) {
                                System.err.println("⚠️ Could not load class name: " + e.getMessage());
                            }
                        }
                        
                        // ========== QR CODE GENERATION ==========
                        System.out.println("🎯 Generating QR code for student: " + studentId);
                        
                        // 1. Generate QR data
                        Map<String, Object> qrDataMap = new HashMap<>();
                        qrDataMap.put("studentId", studentId);
                        qrDataMap.put("firstName", firstName);
                        qrDataMap.put("lastName", lastName);
                        qrDataMap.put("grade", grade);
                        qrDataMap.put("email", email);
                        qrDataMap.put("phone", phone);
                        qrDataMap.put("classId", classId);
                        qrDataMap.put("className", className);
                        qrDataMap.put("registrationDate", LocalDateTime.now().toString());
                        qrDataMap.put("type", "student_id");
                        qrDataMap.put("school", "Sammana Educational Institute");
                        
                        String qrData = new Gson().toJson(qrDataMap);
                        System.out.println("📊 QR Data: " + qrData);
                        
                        // 2. Generate QR code image (300x300 pixels)
                        byte[] qrCodeImage = generateQRCodeImage(qrData, 300, 300);
                        System.out.println("🖼️ QR Image generated: " + qrCodeImage.length + " bytes");
                        
                        // 3. Convert to base64 for frontend
                        String qrImageBase64 = Base64.getEncoder().encodeToString(qrCodeImage);
                        String qrDataUrl = "data:image/png;base64," + qrImageBase64;
                        
                        // 4. Send email with QR code
                        try {
                            emailService.sendQRCodeEmail(
                                email,
                                firstName + " " + lastName,
                                studentId,
                                qrCodeImage,
                                className
                            );
                            System.out.println("📧 Email sent successfully to: " + email);
                        } catch (Exception e) {
                            System.err.println("⚠️ Could not send email: " + e.getMessage());
                            // Don't fail registration if email fails
                        }
                        
                        // 5. Store QR code in database (optional)
                        try {
                            String updateSql = "UPDATE students SET qr_code_data = ? WHERE id = ?";
                            try (PreparedStatement updateStmt = conn.prepareStatement(updateSql)) {
                                updateStmt.setString(1, qrData);
                                updateStmt.setLong(2, newStudentId);
                                updateStmt.executeUpdate();
                            }
                        } catch (Exception e) {
                            System.err.println("⚠️ Could not store QR data: " + e.getMessage());
                        }
                        
                        // 6. Return everything to frontend
                        Map<String, Object> response = new HashMap<>();
                        response.put("success", true);
                        response.put("message", "Student registered successfully");
                        response.put("id", newStudentId);
                        response.put("studentId", studentId);
                        response.put("firstName", firstName);
                        response.put("lastName", lastName);
                        response.put("email", email);
                        response.put("grade", grade);
                        response.put("classId", classId);
                        response.put("className", className);
                        response.put("registrationDate", LocalDate.now().toString());
                        response.put("createdAt", LocalDateTime.now().toString());
                        response.put("status", "Active");
                        response.put("qrData", qrData); // QR data as JSON
                        response.put("qrImage", qrDataUrl); // QR as base64 image
                        
                        System.out.println("✅ DIRECT REGISTRATION COMPLETE WITH QR");
                        return ResponseEntity.ok(response);
                    }
                }
            } catch (Exception e) {
                System.err.println("❌ SQL Error: " + e.getMessage());
                e.printStackTrace();
                throw e;
            }
            
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to create student"));
            
        } catch (Exception e) {
            System.err.println("💥 Direct registration failed: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage(),
                "success", false
            ));
        }
    }
    
    // QR Code Generation Helper Method
    private byte[] generateQRCodeImage(String data, int width, int height) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(
                data, 
                BarcodeFormat.QR_CODE, 
                width, 
                height
            );
            
            java.io.ByteArrayOutputStream pngOutputStream = new java.io.ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            return pngOutputStream.toByteArray();
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR code: " + e.getMessage(), e);
        }
    }
    
    // NEW ENDPOINT: Get QR code for existing student
    @GetMapping("/{studentId}/qr")
    public ResponseEntity<?> getStudentQRCode(@PathVariable String studentId) {
        try {
            System.out.println("🎯 Generating QR code for student: " + studentId);
            
            // Fetch student from database
            String sql = "SELECT s.*, c.class_name FROM students s " +
                        "LEFT JOIN school_classes c ON s.class_id = c.id " +
                        "WHERE s.student_id = ?";
            
            try (Connection conn = dataSource.getConnection();
                 PreparedStatement stmt = conn.prepareStatement(sql)) {
                
                stmt.setString(1, studentId);
                ResultSet rs = stmt.executeQuery();
                
                if (rs.next()) {
                    // Get student data
                    String firstName = rs.getString("first_name");
                    String lastName = rs.getString("last_name");
                    String grade = rs.getString("grade");
                    String email = rs.getString("email");
                    String phone = rs.getString("phone");
                    Long classId = rs.getLong("class_id");
                    String className = rs.getString("class_name");
                    
                    // Generate QR data
                    Map<String, Object> qrDataMap = new HashMap<>();
                    qrDataMap.put("studentId", studentId);
                    qrDataMap.put("firstName", firstName);
                    qrDataMap.put("lastName", lastName);
                    qrDataMap.put("grade", grade);
                    qrDataMap.put("email", email);
                    qrDataMap.put("phone", phone);
                    qrDataMap.put("classId", classId);
                    qrDataMap.put("className", className);
                    qrDataMap.put("registrationDate", LocalDateTime.now().toString());
                    qrDataMap.put("type", "student_id");
                    qrDataMap.put("school", "Sammana Educational Institute");
                    
                    String qrData = new Gson().toJson(qrDataMap);
                    
                    // Generate QR code image
                    byte[] qrCodeImage = generateQRCodeImage(qrData, 300, 300);
                    String qrImageBase64 = Base64.getEncoder().encodeToString(qrCodeImage);
                    String qrDataUrl = "data:image/png;base64," + qrImageBase64;
                    
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("studentId", studentId);
                    response.put("qrData", qrData);
                    response.put("qrImage", qrDataUrl);
                    
                    return ResponseEntity.ok(response);
                } else {
                    return ResponseEntity.notFound().build();
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Error generating QR code: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to generate QR code: " + e.getMessage(),
                "success", false
            ));
        }
    }
    
    // NEW ENDPOINT: Resend QR code email
    @PostMapping("/{studentId}/resend-qr")
    public ResponseEntity<?> resendQRCodeEmail(@PathVariable String studentId) {
        try {
            System.out.println("📧 Resending QR code email for student: " + studentId);
            
            // Fetch student from database
            String sql = "SELECT s.*, c.class_name FROM students s " +
                        "LEFT JOIN school_classes c ON s.class_id = c.id " +
                        "WHERE s.student_id = ?";
            
            try (Connection conn = dataSource.getConnection();
                 PreparedStatement stmt = conn.prepareStatement(sql)) {
                
                stmt.setString(1, studentId);
                ResultSet rs = stmt.executeQuery();
                
                if (rs.next()) {
                    // Get student data
                    String firstName = rs.getString("first_name");
                    String lastName = rs.getString("last_name");
                    String grade = rs.getString("grade");
                    String email = rs.getString("email");
                    String phone = rs.getString("phone");
                    Long classId = rs.getLong("class_id");
                    String className = rs.getString("class_name");
                    
                    // Generate QR data
                    Map<String, Object> qrDataMap = new HashMap<>();
                    qrDataMap.put("studentId", studentId);
                    qrDataMap.put("firstName", firstName);
                    qrDataMap.put("lastName", lastName);
                    qrDataMap.put("grade", grade);
                    qrDataMap.put("email", email);
                    qrDataMap.put("phone", phone);
                    qrDataMap.put("classId", classId);
                    qrDataMap.put("className", className);
                    qrDataMap.put("registrationDate", LocalDateTime.now().toString());
                    qrDataMap.put("type", "student_id");
                    qrDataMap.put("school", "Sammana Educational Institute");
                    
                    String qrData = new Gson().toJson(qrDataMap);
                    
                    // Generate QR code image
                    byte[] qrCodeImage = generateQRCodeImage(qrData, 300, 300);
                    
                    // Send email
                    emailService.sendQRCodeEmail(
                        email,
                        firstName + " " + lastName,
                        studentId,
                        qrCodeImage,
                        className
                    );
                    
                    System.out.println("✅ QR code email resent to: " + email);
                    
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("message", "QR code email resent successfully");
                    response.put("email", email);
                    
                    return ResponseEntity.ok(response);
                } else {
                    return ResponseEntity.notFound().build();
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Error resending email: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to resend email: " + e.getMessage(),
                "success", false
            ));
        }
    }
    
    // KEEP ALL YOUR EXISTING METHODS BELOW...
    @PostMapping("/register")
    public ResponseEntity<?> registerStudent(@RequestBody Student student) {
        try {
            System.out.println("🎯 ===== REGISTER STUDENT CONTROLLER =====");
            System.out.println("📋 Student first name: " + student.getFirstName());
            System.out.println("🏫 SchoolClass object: " + student.getSchoolClass());
            System.out.println("🔢 SchoolClass ID: " + 
                (student.getSchoolClass() != null ? student.getSchoolClass().getId() : "null"));
            
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
            
            System.out.println("✅ Controller: Student registered with ID: " + registeredStudent.getId());
            System.out.println("🎓 Controller: Class ID after registration: " + registeredStudent.getClassId());
            
            return ResponseEntity.ok(registeredStudent);
        } catch (Exception e) {
            System.err.println("💥 Controller error: " + e.getMessage());
            e.printStackTrace();
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
    
    @PostMapping("/register-simple")
    public ResponseEntity<?> registerStudentSimple(@RequestBody Map<String, Object> request) {
        try {
            System.out.println("🎯 SIMPLE REGISTRATION START");
            
            // Extract basic info
            String firstName = (String) request.get("firstName");
            String lastName = (String) request.get("lastName");
            String email = (String) request.get("email");
            String grade = (String) request.get("grade");
            
            // Extract classId
            Long classId = null;
            if (request.get("classId") != null) {
                classId = ((Number) request.get("classId")).longValue();
            }
            
            System.out.println("📋 Simple Registration:");
            System.out.println("   Name: " + firstName + " " + lastName);
            System.out.println("   Class ID: " + classId);
            
            // Create Student
            Student student = new Student();
            student.setFirstName(firstName);
            student.setLastName(lastName);
            student.setEmail(email);
            student.setGrade(grade);
            student.setStatus("Active");
            
            // Set other fields if present
            if (request.get("gender") != null) student.setGender((String) request.get("gender"));
            if (request.get("dob") != null) student.setDob(java.time.LocalDate.parse((String) request.get("dob")));
            if (request.get("phone") != null) student.setPhone((String) request.get("phone"));
            if (request.get("address") != null) student.setAddress((String) request.get("address"));
            if (request.get("city") != null) student.setCity((String) request.get("city"));
            if (request.get("district") != null) student.setDistrict((String) request.get("district"));
            if (request.get("guardianName") != null) student.setGuardianName((String) request.get("guardianName"));
            if (request.get("guardianPhone") != null) student.setGuardianPhone((String) request.get("guardianPhone"));
            if (request.get("relationship") != null) student.setRelationship((String) request.get("relationship"));
            
            // Register with class
            Student registeredStudent;
            if (classId != null) {
                // Set a simple SchoolClass object with just ID
                SchoolClass schoolClass = new SchoolClass();
                schoolClass.setId(classId);
                student.setSchoolClass(schoolClass);
                registeredStudent = studentService.registerStudent(student);
            } else {
                registeredStudent = studentService.registerStudent(student);
            }
            
            System.out.println("✅ Simple Registration Complete:");
            System.out.println("   Student ID: " + registeredStudent.getId());
            System.out.println("   Class ID: " + registeredStudent.getClassId());
            
            return ResponseEntity.ok(registeredStudent);
            
        } catch (Exception e) {
            System.err.println("💥 Simple registration failed: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
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