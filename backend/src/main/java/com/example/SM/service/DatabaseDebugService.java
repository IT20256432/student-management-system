package com.example.SM.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DatabaseDebugService {
    
    @Autowired
    private DataSource dataSource;
    
    /**
     * Check student details directly from database
     */
    public Map<String, Object> checkStudent(Long studentId) {
        Map<String, Object> result = new HashMap<>();
        
        try (Connection conn = dataSource.getConnection()) {
            System.out.println("🔍 DATABASE DEBUG: Checking student ID " + studentId);
            
            // SQL to get student with class info
            String sql = "SELECT s.*, c.class_name, c.grade as class_grade, " +
                        "c.class_teacher, c.room_number " +
                        "FROM students s " +
                        "LEFT JOIN school_classes c ON s.class_id = c.id " +
                        "WHERE s.id = ?";
            
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setLong(1, studentId);
                ResultSet rs = stmt.executeQuery();
                
                if (rs.next()) {
                    result.put("found", true);
                    result.put("id", rs.getLong("id"));
                    result.put("studentId", rs.getString("student_id"));
                    result.put("firstName", rs.getString("first_name"));
                    result.put("lastName", rs.getString("last_name"));
                    result.put("grade", rs.getString("grade"));
                    result.put("email", rs.getString("email"));
                    
                    // Check class_id
                    Long classId = rs.getLong("class_id");
                    boolean hasClassId = !rs.wasNull();
                    
                    result.put("classId", hasClassId ? classId : null);
                    result.put("hasClassId", hasClassId);
                    result.put("className", rs.getString("class_name"));
                    result.put("classGrade", rs.getString("class_grade"));
                    
                    System.out.println("✅ Database shows:");
                    System.out.println("   Student ID: " + rs.getString("student_id"));
                    System.out.println("   Name: " + rs.getString("first_name") + " " + rs.getString("last_name"));
                    System.out.println("   Class ID in DB: " + (hasClassId ? classId : "NULL"));
                    System.out.println("   Class Name: " + rs.getString("class_name"));
                    
                } else {
                    result.put("found", false);
                    result.put("message", "Student not found in database");
                    System.out.println("❌ Student not found in database");
                }
            }
            
        } catch (Exception e) {
            result.put("error", e.getMessage());
            System.err.println("💥 Database error: " + e.getMessage());
            e.printStackTrace();
        }
        
        return result;
    }
    
    /**
     * Check if a class exists
     */
    public Map<String, Object> checkClass(Long classId) {
        Map<String, Object> result = new HashMap<>();
        
        try (Connection conn = dataSource.getConnection()) {
            System.out.println("🔍 DATABASE DEBUG: Checking class ID " + classId);
            
            String sql = "SELECT * FROM school_classes WHERE id = ?";
            
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setLong(1, classId);
                ResultSet rs = stmt.executeQuery();
                
                if (rs.next()) {
                    result.put("exists", true);
                    result.put("id", rs.getLong("id"));
                    result.put("className", rs.getString("class_name"));
                    result.put("grade", rs.getString("grade"));
                    result.put("classTeacher", rs.getString("class_teacher"));
                    result.put("roomNumber", rs.getString("room_number"));
                    result.put("active", rs.getBoolean("active"));
                    
                    System.out.println("✅ Class exists:");
                    System.out.println("   ID: " + rs.getLong("id"));
                    System.out.println("   Name: " + rs.getString("class_name"));
                    System.out.println("   Grade: " + rs.getString("grade"));
                    
                } else {
                    result.put("exists", false);
                    result.put("message", "Class not found");
                    System.out.println("❌ Class not found in database");
                }
            }
            
        } catch (Exception e) {
            result.put("error", e.getMessage());
            System.err.println("💥 Database error: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * Check table structure
     */
    public Map<String, Object> checkTableStructure(String tableName) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, String>> columns = new ArrayList<>();
        
        try (Connection conn = dataSource.getConnection()) {
            System.out.println("🔍 DATABASE DEBUG: Checking table structure for " + tableName);
            
            ResultSet rs = conn.getMetaData().getColumns(null, null, tableName, null);
            
            while (rs.next()) {
                Map<String, String> column = new HashMap<>();
                column.put("name", rs.getString("COLUMN_NAME"));
                column.put("type", rs.getString("TYPE_NAME"));
                column.put("size", rs.getString("COLUMN_SIZE"));
                column.put("nullable", rs.getString("IS_NULLABLE"));
                column.put("default", rs.getString("COLUMN_DEF"));
                columns.add(column);
                
                System.out.println("   Column: " + rs.getString("COLUMN_NAME") + 
                                 " (" + rs.getString("TYPE_NAME") + 
                                 ", nullable: " + rs.getString("IS_NULLABLE") + ")");
            }
            
            result.put("table", tableName);
            result.put("columns", columns);
            result.put("columnCount", columns.size());
            
            // Check foreign keys
            List<Map<String, String>> foreignKeys = new ArrayList<>();
            rs = conn.getMetaData().getImportedKeys(null, null, tableName);
            
            while (rs.next()) {
                Map<String, String> fk = new HashMap<>();
                fk.put("fkColumn", rs.getString("FKCOLUMN_NAME"));
                fk.put("pkTable", rs.getString("PKTABLE_NAME"));
                fk.put("pkColumn", rs.getString("PKCOLUMN_NAME"));
                fk.put("fkName", rs.getString("FK_NAME"));
                foreignKeys.add(fk);
                
                System.out.println("   Foreign Key: " + rs.getString("FKCOLUMN_NAME") + 
                                 " → " + rs.getString("PKTABLE_NAME") + 
                                 "." + rs.getString("PKCOLUMN_NAME"));
            }
            
            result.put("foreignKeys", foreignKeys);
            
        } catch (Exception e) {
            result.put("error", e.getMessage());
            System.err.println("💥 Database error: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * Get recent students (last 5)
     */
    public Map<String, Object> getRecentStudents() {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> students = new ArrayList<>();
        
        try (Connection conn = dataSource.getConnection()) {
            System.out.println("🔍 DATABASE DEBUG: Getting recent students");
            
            String sql = "SELECT s.id, s.student_id, s.first_name, s.last_name, " +
                        "s.class_id, c.class_name, s.created_at " +
                        "FROM students s " +
                        "LEFT JOIN school_classes c ON s.class_id = c.id " +
                        "ORDER BY s.created_at DESC " +
                        "LIMIT 5";
            
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                ResultSet rs = stmt.executeQuery();
                
                while (rs.next()) {
                    Map<String, Object> student = new HashMap<>();
                    student.put("id", rs.getLong("id"));
                    student.put("studentId", rs.getString("student_id"));
                    student.put("firstName", rs.getString("first_name"));
                    student.put("lastName", rs.getString("last_name"));
                    
                    Long classId = rs.getLong("class_id");
                    boolean hasClassId = !rs.wasNull();
                    
                    student.put("classId", hasClassId ? classId : null);
                    student.put("className", rs.getString("class_name"));
                    student.put("createdAt", rs.getTimestamp("created_at"));
                    
                    students.add(student);
                    
                    System.out.println("   Student: " + rs.getString("student_id") + 
                                     " - " + rs.getString("first_name") + " " + rs.getString("last_name") +
                                     " (Class ID: " + (hasClassId ? classId : "NULL") + ")");
                }
            }
            
            result.put("students", students);
            result.put("count", students.size());
            
        } catch (Exception e) {
            result.put("error", e.getMessage());
            System.err.println("💥 Database error: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * Manual test: Create a student directly in database
     */
    public Map<String, Object> createTestStudent(Long classId) {
        Map<String, Object> result = new HashMap<>();
        
        try (Connection conn = dataSource.getConnection()) {
            System.out.println("🧪 DATABASE DEBUG: Creating test student");
            
            // Generate test student ID
            String testStudentId = "TEST" + System.currentTimeMillis() % 10000;
            
            String sql = "INSERT INTO students (" +
                        "student_id, first_name, last_name, grade, email, " +
                        "class_id, status, registration_date, created_at" +
                        ") VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), NOW())";
            
            try (PreparedStatement stmt = conn.prepareStatement(sql, PreparedStatement.RETURN_GENERATED_KEYS)) {
                stmt.setString(1, testStudentId);
                stmt.setString(2, "Test");
                stmt.setString(3, "Student");
                stmt.setString(4, "A/L");
                stmt.setString(5, "test@test.com");
                
                if (classId != null) {
                    stmt.setLong(6, classId);
                } else {
                    stmt.setNull(6, java.sql.Types.BIGINT);
                }
                
                stmt.setString(7, "Active");
                
                int rows = stmt.executeUpdate();
                
                if (rows > 0) {
                    ResultSet keys = stmt.getGeneratedKeys();
                    if (keys.next()) {
                        Long newId = keys.getLong(1);
                        
                        result.put("success", true);
                        result.put("message", "Test student created");
                        result.put("studentId", newId);
                        result.put("generatedStudentId", testStudentId);
                        result.put("classId", classId);
                        
                        System.out.println("✅ Test student created:");
                        System.out.println("   ID: " + newId);
                        System.out.println("   Student ID: " + testStudentId);
                        System.out.println("   Class ID: " + classId);
                        
                        // Return the created student details
                        return checkStudent(newId);
                    }
                }
            }
            
        } catch (Exception e) {
            result.put("error", e.getMessage());
            System.err.println("💥 Database error creating test student: " + e.getMessage());
            e.printStackTrace();
        }
        
        return result;
    }
}