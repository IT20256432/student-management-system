package com.example.SM.controller;

import com.example.SM.service.AdminAuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @Autowired
    private AdminAuthService adminAuthService;
    @PostMapping("/validate")
    public ResponseEntity<?> validateSession() {
        // Simple session validation - USE Map<String, Object> to accept different types
        Map<String, Object> response = new HashMap<>();
        response.put("authenticated", true);  // boolean
        response.put("user", Map.of(
            "username", "admin",
            "role", "ADMIN",
            "fullName", "System Administrator"
        ));
        response.put("message", "Session is valid");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logout successful");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "Authentication Service");
        response.put("message", "Simple admin authentication is active");
        return ResponseEntity.ok(response);
    }

    // This method returns Map<String, String> so only put String values
    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> response = new HashMap<>();
        response.put("success", "false");  // Use String "false" instead of boolean false
        response.put("error", message);
        return response;
    }
    
 // In your AuthController.java - UPDATE THE METHOD SIGNATURES

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        try {
            String username = loginRequest.get("username");
            String password = loginRequest.get("password");

            System.out.println("🔐 Login attempt for user: " + username);

            // Validate input
            if (username == null || username.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Username is required"));
            }

            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Password is required"));
            }

            // Authenticate with simple admin auth
            Map<String, Object> authResult = adminAuthService.authenticate(username, password);

            if (!(Boolean) authResult.get("success")) {
                return ResponseEntity.badRequest().body(createErrorResponse((String) authResult.get("message")));
            }

            // Create success response - USE Map<String, Object> 
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);  // boolean value
            response.put("message", "Login successful");
            response.put("user", authResult.get("user"));
            response.put("authenticated", true);  // boolean value

            System.out.println("✅ Login successful for user: " + username);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("💥 Login error: " + e.getMessage());
            return ResponseEntity.internalServerError().body(createErrorResponse("Login failed: " + e.getMessage()));
        }
    }
    
}