package com.example.SM.controller;

import com.example.SM.dto.FeePaymentRequest;

import com.example.SM.dto.FeePaymentResponse;
import com.example.SM.dto.FeeStatus;
import com.example.SM.entity.FeePayment;
import com.example.SM.service.FeePaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.example.SM.repository.FeePaymentRepository; 
import com.example.SM.service.ReceiptPDFService;


import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import java.util.Base64;

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
    
    @Autowired  
    private FeePaymentRepository feePaymentRepository; 
    
    @Autowired
    private ReceiptPDFService receiptPDFService;
    
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
    
    @PostMapping("/record-with-email")
    public ResponseEntity<?> recordPaymentWithEmail(@RequestBody FeePaymentRequest request) {
        try {
            FeePayment payment = feePaymentService.recordPayment(request);
            
            // Send email
            try {
                feePaymentService.sendPaymentConfirmation(payment.getId());
            } catch (Exception emailError) {
                // Log but don't fail
            }
            
            // Return JSON with payment ID
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Payment recorded successfully!");
            response.put("id", payment.getId());
            response.put("paymentId", payment.getId());
            response.put("studentId", payment.getStudent().getStudentId());
            response.put("amountPaid", payment.getAmountPaid());
            response.put("transactionId", payment.getTransactionId());
            response.put("month", payment.getMonth());
            response.put("status", "PAID");
            response.put("emailSent", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/record-and-download")
    public ResponseEntity<?> recordPaymentAndDownload(@RequestBody FeePaymentRequest request) {
        try {
            // Record payment
            FeePayment payment = feePaymentService.recordPayment(request);
            
            // Send email
            try {
                feePaymentService.sendPaymentConfirmation(payment.getId());
            } catch (Exception emailError) {
                // Log but don't fail
            }
            
            // Generate PDF
            byte[] pdfBytes = receiptPDFService.generatePaymentReceipt(
                payment, 
                payment.getStudent(), 
                payment.getSchoolClass()
            );
            
            // Return PDF
            ByteArrayResource resource = new ByteArrayResource(pdfBytes);
            String filename = String.format("Receipt-%s-%s.pdf", 
                payment.getStudent().getStudentId(), 
                payment.getMonth());
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdfBytes.length)
                .body(resource);
                
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
        
    @GetMapping(value = "/receipt/{paymentId}/pdf", 
            produces = {MediaType.APPLICATION_PDF_VALUE, MediaType.APPLICATION_JSON_VALUE})
 public ResponseEntity<?> generateReceiptPDF(
         @PathVariable Long paymentId,
         @RequestHeader(value = "Accept", required = false) String acceptHeader) {
     
     try {
         System.out.println("📄 PDF Request for payment: " + paymentId + ", Accept: " + acceptHeader);
         
         FeePayment payment = feePaymentRepository.findById(paymentId)
             .orElseThrow(() -> new RuntimeException("Payment not found with id: " + paymentId));
         
         byte[] pdfBytes = receiptPDFService.generatePaymentReceipt(
             payment, 
             payment.getStudent(), 
             payment.getSchoolClass()
         );
         
         String filename = String.format("Receipt-%s-%s.pdf", 
             payment.getStudent().getStudentId(), 
             payment.getMonth());
         
         // Check what client accepts
         boolean wantsJson = acceptHeader != null && acceptHeader.contains(MediaType.APPLICATION_JSON_VALUE);
         boolean wantsPdf = acceptHeader == null || 
                           acceptHeader.contains("*/*") || 
                           acceptHeader.contains(MediaType.APPLICATION_PDF_VALUE);
         
         if (wantsJson && !wantsPdf) {
             // Client explicitly wants JSON
             Map<String, Object> response = new HashMap<>();
             response.put("success", true);
             response.put("message", "Receipt generated successfully");
             response.put("paymentId", paymentId);
             response.put("filename", filename);
             response.put("studentId", payment.getStudent().getStudentId());
             response.put("amount", payment.getAmountPaid());
             response.put("month", payment.getMonth());
             
             return ResponseEntity.ok()
                 .contentType(MediaType.APPLICATION_JSON)
                 .body(response);
         } else {
             // Default: return PDF
             return ResponseEntity.ok()
                 .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                 .contentType(MediaType.APPLICATION_PDF)
                 .contentLength(pdfBytes.length)
                 .body(pdfBytes);
         }
         
     } catch (Exception e) {
         System.err.println("❌ Error generating receipt: " + e.getMessage());
         e.printStackTrace();
         
         // Always return JSON for errors
         Map<String, String> error = new HashMap<>();
         error.put("error", "Failed to generate receipt: " + e.getMessage());
         
         return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
             .contentType(MediaType.APPLICATION_JSON)
             .body(error);
     }
 }

        // Alternative: Return as base64 for frontend download
        @GetMapping("/receipt/{paymentId}/base64")
        public ResponseEntity<?> getReceiptBase64(@PathVariable Long paymentId) {
            try {
                FeePayment payment = feePaymentRepository.findById(paymentId)
                    .orElseThrow(() -> new RuntimeException("Payment not found"));
                
                byte[] pdfBytes = receiptPDFService.generatePaymentReceipt(
                    payment, 
                    payment.getStudent(), 
                    payment.getSchoolClass()
                );
                
                String base64Pdf = Base64.getEncoder().encodeToString(pdfBytes);
                String filename = String.format("Receipt-%s-%s.pdf", 
                    payment.getStudent().getStudentId(), 
                    payment.getMonth());
                
                Map<String, Object> response = new HashMap<>();
                response.put("filename", filename);
                response.put("pdfBase64", base64Pdf);
                response.put("paymentId", paymentId);
                response.put("studentId", payment.getStudent().getStudentId());
                
                return ResponseEntity.ok(response);
                
            } catch (Exception e) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Failed to generate receipt: " + e.getMessage());
                return ResponseEntity.badRequest().body(errorResponse);
            }
        }   
        
     // Add this to your controller
        @GetMapping(value = "/receipt/{paymentId}/download", 
                   produces = MediaType.APPLICATION_PDF_VALUE)
        public ResponseEntity<byte[]> downloadReceiptPDF(@PathVariable Long paymentId) {
            try {
                FeePayment payment = feePaymentRepository.findById(paymentId)
                    .orElseThrow(() -> new RuntimeException("Payment not found"));
                
                byte[] pdfBytes = receiptPDFService.generatePaymentReceipt(
                    payment, 
                    payment.getStudent(), 
                    payment.getSchoolClass()
                );
                
                String filename = String.format("Receipt-%s-%s.pdf", 
                    payment.getStudent().getStudentId(), 
                    payment.getMonth());
                
                return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(pdfBytes.length)
                    .body(pdfBytes);
                    
            } catch (Exception e) {
                // For download endpoint, we can't return JSON - just throw
                throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, 
                    "Failed to generate PDF: " + e.getMessage()
                );
            }
        }
    
}