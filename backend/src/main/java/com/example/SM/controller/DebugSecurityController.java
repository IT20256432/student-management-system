// src/main/java/com/example/SM/controller/DebugSecurityController.java
package com.example.SM.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/debug/security")
public class DebugSecurityController {

    @GetMapping("/public-test")
    public Map<String, String> publicTest() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "This is a public endpoint");
        response.put("status", "SUCCESS");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        response.put("security", "Security is properly configured");
        return response;
    }
    
    @GetMapping("/test")
    public Map<String, Object> securityTest() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Security debug endpoint");
        response.put("status", "WORKING");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        response.put("endpointsWorking", true);
        return response;
    }
}