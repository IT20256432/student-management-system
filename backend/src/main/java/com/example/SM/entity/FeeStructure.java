package com.example.SM.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "fee_structures")
public class FeeStructure {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "class_id", unique = true)
    private SchoolClass schoolClass;

    @Column(name = "monthly_fee", precision = 10, scale = 2)
    private BigDecimal monthlyFee = BigDecimal.ZERO;

    @Column(name = "admission_fee", precision = 10, scale = 2)
    private BigDecimal admissionFee = BigDecimal.ZERO;

    @Column(name = "exam_fee", precision = 10, scale = 2)
    private BigDecimal examFee = BigDecimal.ZERO;

    @Column(name = "sports_fee", precision = 10, scale = 2)
    private BigDecimal sportsFee = BigDecimal.ZERO;

    @Column(name = "library_fee", precision = 10, scale = 2)
    private BigDecimal libraryFee = BigDecimal.ZERO;

    @Column(name = "lab_fee", precision = 10, scale = 2)
    private BigDecimal labFee = BigDecimal.ZERO;

    @Column(name = "other_fee", precision = 10, scale = 2)
    private BigDecimal otherFee = BigDecimal.ZERO;

    @Column(name = "total_fee", precision = 10, scale = 2)
    private BigDecimal totalFee = BigDecimal.ZERO;

    @Column(name = "description")
    private String description;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Pre-persist and pre-update to calculate total fee
    @PrePersist
    @PreUpdate
    public void calculateTotalFee() {
        this.totalFee = monthlyFee
                .add(admissionFee)
                .add(examFee)
                .add(sportsFee)
                .add(libraryFee)
                .add(labFee)
                .add(otherFee);
    }

    // Constructors
    public FeeStructure() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public SchoolClass getSchoolClass() { return schoolClass; }
    public void setSchoolClass(SchoolClass schoolClass) { this.schoolClass = schoolClass; }

    public BigDecimal getMonthlyFee() { return monthlyFee; }
    public void setMonthlyFee(BigDecimal monthlyFee) { this.monthlyFee = monthlyFee; }

    public BigDecimal getAdmissionFee() { return admissionFee; }
    public void setAdmissionFee(BigDecimal admissionFee) { this.admissionFee = admissionFee; }

    public BigDecimal getExamFee() { return examFee; }
    public void setExamFee(BigDecimal examFee) { this.examFee = examFee; }

    public BigDecimal getSportsFee() { return sportsFee; }
    public void setSportsFee(BigDecimal sportsFee) { this.sportsFee = sportsFee; }

    public BigDecimal getLibraryFee() { return libraryFee; }
    public void setLibraryFee(BigDecimal libraryFee) { this.libraryFee = libraryFee; }

    public BigDecimal getLabFee() { return labFee; }
    public void setLabFee(BigDecimal labFee) { this.labFee = labFee; }

    public BigDecimal getOtherFee() { return otherFee; }
    public void setOtherFee(BigDecimal otherFee) { this.otherFee = otherFee; }

    public BigDecimal getTotalFee() { return totalFee; }
    public void setTotalFee(BigDecimal totalFee) { this.totalFee = totalFee; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}