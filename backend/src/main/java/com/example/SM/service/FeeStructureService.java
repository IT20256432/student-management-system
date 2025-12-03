package com.example.SM.service;

import com.example.SM.entity.FeeStructure;
import com.example.SM.entity.SchoolClass;
import com.example.SM.repository.FeeStructureRepository;
import com.example.SM.repository.SchoolClassRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FeeStructureService {
    
    @Autowired
    private FeeStructureRepository feeStructureRepository;
    
    @Autowired
    private SchoolClassRepository schoolClassRepository;
    
    public List<FeeStructure> getAllFees() {
        return feeStructureRepository.findAll();
    }
    
    public Optional<FeeStructure> getFeeByClassId(Long classId) {
        return feeStructureRepository.findBySchoolClassId(classId);
    }
    
    public FeeStructure createFeeStructure(FeeStructure feeStructure) {
        // Validate class exists
        if (feeStructure.getSchoolClass() == null || feeStructure.getSchoolClass().getId() == null) {
            throw new RuntimeException("Class ID is required");
        }
        
        Optional<SchoolClass> schoolClass = schoolClassRepository.findById(feeStructure.getSchoolClass().getId());
        if (schoolClass.isEmpty()) {
            throw new RuntimeException("Class not found with id: " + feeStructure.getSchoolClass().getId());
        }
        
        // Check if fee structure already exists for this class
        if (feeStructureRepository.existsBySchoolClassId(feeStructure.getSchoolClass().getId())) {
            throw new RuntimeException("Fee structure already exists for this class");
        }
        
        feeStructure.setSchoolClass(schoolClass.get());
        feeStructure.calculateTotalFee();
        
        return feeStructureRepository.save(feeStructure);
    }
    
    public FeeStructure updateFeeStructure(Long id, FeeStructure feeDetails) {
        Optional<FeeStructure> existingFee = feeStructureRepository.findById(id);
        if (existingFee.isPresent()) {
            FeeStructure feeStructure = existingFee.get();
            
            feeStructure.setMonthlyFee(feeDetails.getMonthlyFee());
            feeStructure.setAdmissionFee(feeDetails.getAdmissionFee());
            feeStructure.setExamFee(feeDetails.getExamFee());
            feeStructure.setSportsFee(feeDetails.getSportsFee());
            feeStructure.setLibraryFee(feeDetails.getLibraryFee());
            feeStructure.setLabFee(feeDetails.getLabFee());
            feeStructure.setOtherFee(feeDetails.getOtherFee());
            feeStructure.setDescription(feeDetails.getDescription());
            feeStructure.calculateTotalFee();
            
            return feeStructureRepository.save(feeStructure);
        }
        throw new RuntimeException("Fee structure not found with id: " + id);
    }
    
    public void deleteFeeStructure(Long id) {
        feeStructureRepository.deleteById(id);
    }
}