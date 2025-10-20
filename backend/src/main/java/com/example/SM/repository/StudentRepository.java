package com.example.SM.repository;

import com.example.SM.entity.SchoolClass;
import com.example.SM.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByStudentId(String studentId);
    List<Student> findByGrade(String grade);
    List<Student> findByStatus(String status);
    
    // Class-based queries
    List<Student> findBySchoolClass(SchoolClass schoolClass);
    List<Student> findBySchoolClassId(Long classId);
    
    @Query("SELECT s FROM Student s WHERE s.schoolClass IS NULL")
    List<Student> findBySchoolClassIsNull();
    
    @Query("SELECT COUNT(s) FROM Student s WHERE s.schoolClass.id = :classId")
    Long countByClassId(Long classId);
    
    @Query("SELECT s FROM Student s WHERE s.schoolClass.id = :classId AND s.status = 'Active'")
    List<Student> findActiveStudentsByClassId(Long classId);
    
    // Keep only the methods you actually need
}