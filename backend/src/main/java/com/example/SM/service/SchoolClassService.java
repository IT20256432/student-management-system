package com.example.SM.service;

import com.example.SM.entity.SchoolClass;
import com.example.SM.repository.SchoolClassRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SchoolClassService {
    
    @Autowired
    private SchoolClassRepository schoolClassRepository;
    
    public List<SchoolClass> getAllClasses() {
        return schoolClassRepository.findAll();
    }
    
    public List<SchoolClass> getActiveClasses() {
        return schoolClassRepository.findByActiveTrue();
    }
    
    public List<SchoolClass> getClassesByGrade(String grade) {
        try {
            System.out.println("🎯 Service - Searching for grade: '" + grade + "'");
            
            // Clean the grade string
            String cleanGrade = grade.trim();
            System.out.println("🎯 Service - Cleaned grade: '" + cleanGrade + "'");
            
            // First try exact match
            List<SchoolClass> classes = schoolClassRepository.findByGradeAndActiveTrue(cleanGrade);
            
            if (classes.isEmpty()) {
                System.out.println("⚠️ No exact match found, trying all active classes");
                // Try case-insensitive search
                List<SchoolClass> allActiveClasses = schoolClassRepository.findByActiveTrue();
                
                // Use stream with Collectors.toList()
                classes = allActiveClasses.stream()
                    .filter(c -> c.getGrade() != null && c.getGrade().trim().equalsIgnoreCase(cleanGrade))
                    .collect(Collectors.toList());
            }
            
            if (classes.isEmpty()) {
                System.out.println("⚠️ Still no classes found, returning all active classes as fallback");
                // Return all active classes as fallback
                classes = schoolClassRepository.findByActiveTrue();
            }
            
            System.out.println("✅ Service - Returning " + classes.size() + " classes");
            return classes;
            
        } catch (Exception e) {
            System.err.println("❌ Service error in getClassesByGrade: " + e.getMessage());
            e.printStackTrace();
            // Return empty list instead
            return new ArrayList<>();
        }
    }
    
    public Optional<SchoolClass> getClassById(Long id) {
        return schoolClassRepository.findById(id);
    }
    
    public SchoolClass createClass(SchoolClass schoolClass) {
        if (schoolClassRepository.findByClassName(schoolClass.getClassName()).isPresent()) {
            throw new RuntimeException("Class name already exists: " + schoolClass.getClassName());
        }
        return schoolClassRepository.save(schoolClass);
    }
    
    public SchoolClass updateClass(Long id, SchoolClass classDetails) {
        Optional<SchoolClass> existingClass = schoolClassRepository.findById(id);
        if (existingClass.isPresent()) {
            SchoolClass schoolClass = existingClass.get();
            schoolClass.setClassName(classDetails.getClassName());
            schoolClass.setGrade(classDetails.getGrade());
            schoolClass.setStream(classDetails.getStream());
            schoolClass.setClassTeacher(classDetails.getClassTeacher());
            schoolClass.setRoomNumber(classDetails.getRoomNumber());
            schoolClass.setActive(classDetails.isActive());
            return schoolClassRepository.save(schoolClass);
        }
        throw new RuntimeException("Class not found with id: " + id);
    }
    
    public void deleteClass(Long id) {
        schoolClassRepository.deleteById(id);
    }
    
    public SchoolClass deactivateClass(Long id) {
        Optional<SchoolClass> schoolClass = schoolClassRepository.findById(id);
        if (schoolClass.isPresent()) {
            SchoolClass cls = schoolClass.get();
            cls.setActive(false);
            return schoolClassRepository.save(cls);
        }
        throw new RuntimeException("Class not found with id: " + id);
    }
}