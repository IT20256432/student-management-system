package com.example.SM.controller;

import com.example.SM.dto.LoginRequest;
import com.example.SM.entity.User;
import com.example.SM.repository.UserRepository;
import com.example.SM.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            String username = loginRequest.getUsername();
            String password = loginRequest.getPassword();

            System.out.println("🔐 Login attempt for user: " + username);

            // Validate input
            if (username == null || username.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Username is required"));
            }

            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Password is required"));
            }

            // Find user in database
            Optional<User> userOptional = userRepository.findByUsername(username);
            
            if (userOptional.isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Invalid username or password"));
            }
            
            User user = userOptional.get();
            
            // Check if user is active
            if (!user.isActive()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Account is deactivated"));
            }
            
            // Verify password
            if (!passwordEncoder.matches(password, user.getPassword())) {
                return ResponseEntity.badRequest().body(createErrorResponse("Invalid username or password"));
            }
            
            // Update last login
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
            
            // Generate JWT token
            String token = jwtUtil.generateToken(
                user.getUsername(), 
                user.getRole(), 
                user.getFullName()
            );
            
            System.out.println("✅ Login successful for user: " + username);
            System.out.println("🔑 Token generated: " + (token != null ? "YES, length: " + token.length() : "NO"));
            
            // Create response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Login successful");
            response.put("token", token);
            response.put("username", user.getUsername());
            response.put("role", user.getRole());
            response.put("fullName", user.getFullName());
            response.put("email", user.getEmail());
            
            // Also include user object for compatibility
            Map<String, Object> userObj = new HashMap<>();
            userObj.put("username", user.getUsername());
            userObj.put("role", user.getRole());
            userObj.put("fullName", user.getFullName());
            userObj.put("email", user.getEmail());
            response.put("user", userObj);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("💥 Login error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(createErrorResponse("Login failed: " + e.getMessage()));
        }
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validateSession(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            System.out.println("🔍 Validate session called");
            System.out.println("🔍 Authorization header: " + authHeader);
            
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                Map<String, Object> response = new HashMap<>();
                response.put("authenticated", false);
                response.put("message", "No valid token provided");
                return ResponseEntity.ok(response);
            }
            
            String token = authHeader.substring(7);
            System.out.println("🔍 Token received: " + (token != null ? token.substring(0, Math.min(20, token.length())) + "..." : "NULL"));
            
            String username = jwtUtil.extractUsername(token);
            
            if (username == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("authenticated", false);
                response.put("message", "Invalid token");
                return ResponseEntity.ok(response);
            }
            
            if (jwtUtil.isTokenExpired(token)) {
                Map<String, Object> response = new HashMap<>();
                response.put("authenticated", false);
                response.put("message", "Token expired");
                return ResponseEntity.ok(response);
            }
            
            // Find user in database
            Optional<User> userOptional = userRepository.findByUsername(username);
            
            if (userOptional.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("authenticated", false);
                response.put("message", "User not found");
                return ResponseEntity.ok(response);
            }
            
            User user = userOptional.get();
            
            Map<String, Object> response = new HashMap<>();
            response.put("authenticated", true);
            response.put("message", "Session is valid");
            response.put("user", Map.of(
                "username", user.getUsername(),
                "role", user.getRole(),
                "fullName", user.getFullName(),
                "email", user.getEmail()
            ));
            
            System.out.println("✅ Session validated for user: " + username);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Session validation error: " + e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("authenticated", false);
            response.put("message", "Validation failed: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logout successful");
        System.out.println("👋 Logout endpoint called");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "Authentication Service");
        response.put("message", "JWT authentication is active");
        response.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }
    
    // Debug endpoint to check token
    @GetMapping("/debug-token")
    public ResponseEntity<?> debugToken(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> response = new HashMap<>();
        
        response.put("hasAuthHeader", authHeader != null);
        response.put("authHeader", authHeader);
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            response.put("hasToken", true);
            response.put("tokenLength", token.length());
            response.put("tokenPreview", token.substring(0, Math.min(30, token.length())) + "...");
            
            try {
                String username = jwtUtil.extractUsername(token);
                response.put("extractedUsername", username);
                response.put("isTokenExpired", jwtUtil.isTokenExpired(token));
                response.put("isTokenValid", jwtUtil.validateToken(token, username));
            } catch (Exception e) {
                response.put("tokenError", e.getMessage());
            }
        } else {
            response.put("hasToken", false);
        }
        
        return ResponseEntity.ok(response);
    }
    
    // Simple test endpoint that requires authentication
    @GetMapping("/test-protected")
    public ResponseEntity<?> testProtected() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "This is a protected endpoint");
        response.put("status", "OK");
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("note", "If you see this, your authentication is working!");
        return ResponseEntity.ok(response);
    }

    // ✅ FIXED: Return Map<String, Object> instead of Map<String, String>
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);  // boolean value
        response.put("error", message);  // string value
        return response;
    }
}