package com.example.SM.dto;

public class LoginResponse {
    private String token;
    private String username;
    private String role;
    private String fullName;
    private String message;
    private boolean success;

    public LoginResponse() {}

    public LoginResponse(String token, String username, String role, String fullName, String message) {
        this.token = token;
        this.username = username;
        this.role = role;
        this.fullName = fullName;
        this.message = message;
        this.success = true;
    }
    
    public LoginResponse(String token, String username, String role, String fullName, String message, boolean success) {
        this.token = token;
        this.username = username;
        this.role = role;
        this.fullName = fullName;
        this.message = message;
        this.success = success;
    }

    // Getters and Setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
}