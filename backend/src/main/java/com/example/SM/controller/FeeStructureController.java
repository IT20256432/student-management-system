package com.example.SM.controller;

import com.example.SM.entity.FeeStructure;
import com.example.SM.service.FeeStructureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/fees")
@CrossOrigin(origins = "http://localhost:3000")
public class FeeStructureController {
    
    @Autowired
    private FeeStructureService feeStructureService;
    
    @GetMapping
    public List<FeeStructure> getAllFees() {
        return feeStructureService.getAllFees();
    }
    
    @PostMapping
    public ResponseEntity<?> createFeeStructure(@RequestBody FeeStructure feeStructure) {
        try {
            FeeStructure createdFee = feeStructureService.createFeeStructure(feeStructure);
            return ResponseEntity.ok(createdFee);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateFeeStructure(@PathVariable Long id, @RequestBody FeeStructure feeStructure) {
        try {
            FeeStructure updatedFee = feeStructureService.updateFeeStructure(id, feeStructure);
            return ResponseEntity.ok(updatedFee);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFeeStructure(@PathVariable Long id) {
        try {
            feeStructureService.deleteFeeStructure(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/class/{classId}")
    public ResponseEntity<?> getFeeByClassId(@PathVariable Long classId) {
        try {
            System.out.println("🔍 Fetching fee structure for class ID: " + classId);
            
            Optional<FeeStructure> feeStructure = feeStructureService.getFeeByClassId(classId);
            
            if (feeStructure.isPresent()) {
                System.out.println("✅ Fee structure found for class: " + classId);
                return ResponseEntity.ok(feeStructure.get());
            } else {
                System.out.println("❌ No fee structure found for class: " + classId);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("💥 Error fetching fee structure: " + e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to fetch fee structure: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}