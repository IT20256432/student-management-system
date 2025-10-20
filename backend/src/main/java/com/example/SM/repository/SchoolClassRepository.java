package com.example.SM.repository;

import com.example.SM.entity.SchoolClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SchoolClassRepository extends JpaRepository<SchoolClass, Long> {
    Optional<SchoolClass> findByClassName(String className);
    List<SchoolClass> findByGrade(String grade);
    List<SchoolClass> findByActiveTrue();
    List<SchoolClass> findByGradeAndActiveTrue(String grade);
    
    @Query("SELECT c FROM SchoolClass c WHERE c.active = true ORDER BY c.grade, c.className")
    List<SchoolClass> findAllActiveClasses();
}