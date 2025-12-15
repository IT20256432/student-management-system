package com.example.SM.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    @Autowired
    private DataSource dataSource;

    @GetMapping("/institute-db-status")
    public ResponseEntity<?> instituteDbStatus() {
        Map<String, Object> response = new HashMap<>();
        
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            
            response.put("status", "CONNECTED");
            response.put("database", metaData.getDatabaseProductName());
            response.put("databaseName", "institute");
            response.put("url", metaData.getURL());
            
            // Get all tables in institute database
            List<String> tables = new ArrayList<>();
            ResultSet rs = metaData.getTables("institute", null, "%", new String[]{"TABLE"});
            while (rs.next()) {
                tables.add(rs.getString("TABLE_NAME"));
            }
            response.put("tables", tables);
            response.put("tableCount", tables.size());
            
            // Check for essential tables
            response.put("hasUsersTable", tables.contains("users") || tables.contains("USERS"));
            response.put("hasStudentsTable", tables.contains("students") || tables.contains("STUDENTS"));
            response.put("hasClassesTable", tables.contains("school_classes") || tables.contains("SCHOOL_CLASSES"));
            
            System.out.println("✅ Connected to 'institute' database successfully!");
            System.out.println("📋 Tables found: " + tables);
            
        } catch (Exception e) {
            response.put("status", "ERROR");
            response.put("error", e.getMessage());
            response.put("database", "institute");
            System.err.println("❌ Failed to connect to 'institute' database: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/check-essential-data")
    public ResponseEntity<?> checkEssentialData() {
        Map<String, Object> response = new HashMap<>();
        
        try (Connection connection = dataSource.getConnection()) {
            
            // Check if users table has data
            try (var stmt = connection.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT COUNT(*) as count FROM users")) {
                if (rs.next()) {
                    response.put("userCount", rs.getInt("count"));
                }
            }
            
            // Check if students table has data
            try (var stmt = connection.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT COUNT(*) as count FROM students")) {
                if (rs.next()) {
                    response.put("studentCount", rs.getInt("count"));
                }
            }
            
            // Check if classes table has data
            try (var stmt = connection.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT COUNT(*) as count FROM school_classes")) {
                if (rs.next()) {
                    response.put("classCount", rs.getInt("count"));
                }
            }
            
            response.put("status", "SUCCESS");
            
        } catch (Exception e) {
            response.put("status", "ERROR");
            response.put("error", e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/security")
    public Map<String, Object> getSecurityInfo() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        Map<String, Object> info = new HashMap<>();
        info.put("authenticated", auth != null && auth.isAuthenticated());
        
        if (auth != null) {
            info.put("name", auth.getName());
            info.put("principal", auth.getPrincipal().toString());
            info.put("authorities", auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()));
        }
        
        return info;
    }
    
    @GetMapping("/headers")
    public Map<String, String> getHeaders(@RequestHeader Map<String, String> headers) {
        Map<String, String> filteredHeaders = new HashMap<>();
        
        // Filter and display only relevant headers
        headers.forEach((key, value) -> {
            if (key.toLowerCase().contains("auth") || 
                key.toLowerCase().contains("origin") || 
                key.toLowerCase().contains("content") ||
                key.equalsIgnoreCase("user-agent")) {
                filteredHeaders.put(key, value);
            }
        });
        
        return filteredHeaders;
    }
    
    @GetMapping("/config")
    public Map<String, String> getConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("server.port", "8080");
        config.put("security.enabled", "true");
        config.put("jwt.enabled", "true");
        config.put("cors.enabled", "true");
        config.put("auth.type", "JWT Bearer Token");
        return config;
    }
}