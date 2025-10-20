// dto/QRData.java
package com.example.SM.dto;

public class QRData {
    private String studentId;
    private String firstName;
    private String lastName;
    private String grade;
    private String email;
    
    // Constructors
    public QRData() {}
    
    public QRData(String studentId, String firstName, String lastName, String grade, String email) {
        this.studentId = studentId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.grade = grade;
        this.email = email;
    }
    
    // Getters and Setters
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}