package com.example.SM.controller;

import com.example.SM.dto.FeePaymentRequest;
import com.example.SM.dto.FeePaymentResponse;
import com.example.SM.dto.FeeStatus;
import com.example.SM.entity.FeePayment;
import com.example.SM.service.FeePaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fee-payments")
@CrossOrigin(origins = "http://localhost:3000")
public class FeePaymentController {
    
    @Autowired
    private FeePaymentService feePaymentService;
    
    @PostMapping("/record")
    public ResponseEntity<?> recordPayment(@RequestBody FeePaymentRequest request) {
        try {
            FeePayment payment = feePaymentService.recordPayment(request);
            return ResponseEntity.ok(payment);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    // FIXED: Changed return type from List<FeePayment> to List<FeePaymentResponse>
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<FeePaymentResponse>> getStudentPayments(@PathVariable String studentId) {
        try {
            List<FeePaymentResponse> payments = feePaymentService.getStudentPayments(studentId);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/student/{studentId}/status")
    public ResponseEntity<FeeStatus> getFeeStatus(@PathVariable String studentId) {
        try {
            FeeStatus feeStatus = feePaymentService.getFeeStatus(studentId);
            return ResponseEntity.ok(feeStatus);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    // FIXED: Changed return type from List<FeePayment> to List<FeePaymentResponse>
    @GetMapping("/recent")
    public ResponseEntity<List<FeePaymentResponse>> getRecentPayments() {
        try {
            List<FeePaymentResponse> payments = feePaymentService.getRecentPayments();
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/overdue")
    public ResponseEntity<List<FeeStatus>> getOverdueStudents() {
        try {
            List<FeeStatus> overdueStudents = feePaymentService.getOverdueStudents();
            return ResponseEntity.ok(overdueStudents);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getFeeStatistics() {
        try {
            Map<String, Object> statistics = feePaymentService.getFeeStatistics();
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    
    }
}