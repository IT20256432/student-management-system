package com.example.SM.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "students")
public class Student {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "student_id", unique = true, nullable = false)
    private String studentId;
    
    @Column(name = "first_name", nullable = false)
    private String firstName;
    
    @Column(name = "last_name", nullable = false)
    private String lastName;
    
    @Column(name = "gender")
    private String gender;
    
    @Column(name = "dob")
    private LocalDate dob;
    
    @Column(name = "grade", nullable = false)
    private String grade;
    
    @Column(name = "email", nullable = false)
    private String email;
    
    @Column(name = "phone")
    private String phone;
    
    @Column(name = "address")
    private String address;
    
    @Column(name = "city")
    private String city;
    
    @Column(name = "district")
    private String district;
    
    @Column(name = "guardian_name")
    private String guardianName;
    
    @Column(name = "guardian_phone")
    private String guardianPhone;
    
    @Column(name = "relationship")
    private String relationship;
    
    @Column(name = "registration_date")
    private LocalDate registrationDate;
    
    @Column(name = "status")
    private String status;
    
    @Column(name = "subjects")
    private String subjects;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // FIXED: Added cascade configuration for proper relationship persistence
    @ManyToOne(
        fetch = FetchType.LAZY,
        cascade = {CascadeType.MERGE, CascadeType.REFRESH}
    )
    @JoinColumn(
        name = "class_id", 
        referencedColumnName = "id",
        foreignKey = @ForeignKey(name = "fk_student_class")
    )
    @JsonIgnore
    private SchoolClass schoolClass;

    // Constructors
    public Student() {
        this.registrationDate = LocalDate.now();
        this.status = "Active";
        this.createdAt = LocalDateTime.now();
    }

    // JSON Properties for class information - ADD @JsonProperty annotations!
    @JsonProperty("classId")
    public Long getClassId() {
        return schoolClass != null ? schoolClass.getId() : null;
    }

    @JsonProperty("className")
    public String getClassName() {
        return schoolClass != null ? schoolClass.getClassName() : null;
    }

    @JsonProperty("classTeacher")
    public String getClassTeacher() {
        return schoolClass != null ? schoolClass.getClassTeacher() : null;
    }

    @JsonProperty("roomNumber")
    public String getRoomNumber() {
        return schoolClass != null ? schoolClass.getRoomNumber() : null;
    }

    // IMPORTANT: Add a setter for schoolClass that automatically updates grade
    public void setSchoolClass(SchoolClass schoolClass) {
        this.schoolClass = schoolClass;
        // Automatically update grade when class is set
        if (schoolClass != null && schoolClass.getGrade() != null) {
            this.grade = schoolClass.getGrade();
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public LocalDate getDob() {
        return dob;
    }

    public void setDob(LocalDate dob) {
        this.dob = dob;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getGuardianName() {
        return guardianName;
    }

    public void setGuardianName(String guardianName) {
        this.guardianName = guardianName;
    }

    public String getGuardianPhone() {
        return guardianPhone;
    }

    public void setGuardianPhone(String guardianPhone) {
        this.guardianPhone = guardianPhone;
    }

    public String getRelationship() {
        return relationship;
    }

    public void setRelationship(String relationship) {
        this.relationship = relationship;
    }

    public LocalDate getRegistrationDate() {
        return registrationDate;
    }

    public void setRegistrationDate(LocalDate registrationDate) {
        this.registrationDate = registrationDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSubjects() {
        return subjects;
    }

    public void setSubjects(String subjects) {
        this.subjects = subjects;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    // Keep the getter for schoolClass (used internally)
    public SchoolClass getSchoolClass() {
        return schoolClass;
    }
    
    @Override
    public String toString() {
        return "Student{" +
                "id=" + id +
                ", studentId='" + studentId + '\'' +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", grade='" + grade + '\'' +
                ", classId=" + getClassId() +
                ", className='" + getClassName() + '\'' +
                '}';
    }
}