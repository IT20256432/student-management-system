package com.example.SM.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AdminAuthService {
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    // Simple hardcoded admin credentials
    private final String ADMIN_USERNAME = "admin";
    private String ADMIN_PASSWORD; // This will be set in constructor
    private final String ADMIN_EMAIL = "admin@school.com";
    private final String ADMIN_FULL_NAME = "System Administrator";
    
    public AdminAuthService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
        // Encode the password on startup
        this.ADMIN_PASSWORD = passwordEncoder.encode("admin123");
    }
    
    public Map<String, Object> authenticate(String username, String password) {
        Map<String, Object> response = new HashMap<>();
        
        if (!ADMIN_USERNAME.equals(username)) {
            response.put("success", false);  // boolean in Map<String, Object>
            response.put("message", "Invalid username");
            return response;
        }
        
        if (!passwordEncoder.matches(password, ADMIN_PASSWORD)) {
            response.put("success", false);  // boolean in Map<String, Object>
            response.put("message", "Invalid password");
            return response;
        }
        
        // Successful login
        response.put("success", true);  // boolean in Map<String, Object>
        response.put("message", "Login successful");
        response.put("user", Map.of(
            "username", ADMIN_USERNAME,
            "email", ADMIN_EMAIL,
            "fullName", ADMIN_FULL_NAME,
            "role", "ADMIN"
        ));
        
        return response;
    }
    
    public boolean validateAdmin() {
        // For now, just return true since we have simple admin auth
        return true;
    }
}