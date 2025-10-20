package com.example.SM.service;

import com.example.SM.entity.SchoolClass;
import com.example.SM.repository.SchoolClassRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

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
        return schoolClassRepository.findByGradeAndActiveTrue(grade);
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