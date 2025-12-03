package com.example.SM.repository;

import com.example.SM.entity.FeeStructure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeeStructureRepository extends JpaRepository<FeeStructure, Long> {
    Optional<FeeStructure> findBySchoolClassId(Long classId);
    List<FeeStructure> findBySchoolClassGrade(String grade);
    boolean existsBySchoolClassId(Long classId);
}