package com.example.SM.service;

import com.example.SM.entity.SchoolClass;
import com.example.SM.entity.Student;
import com.example.SM.repository.SchoolClassRepository;
import com.example.SM.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
    
    public Student registerStudent(Student student) {
        if (student.getStudentId() == null || student.getStudentId().isEmpty()) {
            student.setStudentId(generateStudentId(student));
        }
        
        if (student.getSchoolClass() != null && student.getSchoolClass().getId() != null) {
            Optional<SchoolClass> schoolClass = schoolClassRepository.findById(student.getSchoolClass().getId());
            if (schoolClass.isPresent()) {
                student.setSchoolClass(schoolClass.get());
                
                if (!student.getGrade().equals(schoolClass.get().getGrade())) {
                    throw new RuntimeException("Student grade must match class grade");
                }
            } else {
                throw new RuntimeException("Invalid class ID: " + student.getSchoolClass().getId());
            }
        }
        
        return studentRepository.save(student);
    }
    
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
    
    private String generateStudentId(Student student) {
        String prefix = student.getGrade().equals("A/L") ? "AL" : "OL";
        String year = String.valueOf(java.time.Year.now().getValue()).substring(2);
        String random = String.format("%04d", (int)(Math.random() * 10000));
        return prefix + year + random;
    }
}