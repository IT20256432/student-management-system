package com.example.SM.controller;

import com.example.SM.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/qrcode")
@CrossOrigin(origins = "http://localhost:3000")
public class QRCodeController {

    @Autowired
    private StudentService studentService;

    @PostMapping("/resend/{studentId}")
    public ResponseEntity<?> resendQRCode(@PathVariable String studentId) {
        try {
            studentService.resendQRCode(studentId);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "QR code sent successfully to student's email");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to send QR code: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}