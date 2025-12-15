package com.example.SM.repository;

import com.example.SM.entity.FeePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FeePaymentRepository extends JpaRepository<FeePayment, Long> {
    
    List<FeePayment> findByStudentStudentIdOrderByPaymentDateDesc(String studentId);
    
    List<FeePayment> findByStudentIdOrderByPaymentDateDesc(Long studentId);
    
    // UPDATE THIS METHOD to include classId
    Optional<FeePayment> findByStudentStudentIdAndMonthAndSchoolClassId(String studentId, String month, Long classId);
    
    // ADD THIS METHOD for class-specific payments
    List<FeePayment> findByStudentStudentIdAndSchoolClassIdOrderByPaymentDateDesc(String studentId, Long classId);
    
    @Query("SELECT COALESCE(SUM(fp.amountPaid), 0) FROM FeePayment fp WHERE fp.student.studentId = :studentId AND fp.month = :month")
    BigDecimal findTotalPaidByStudentAndMonth(@Param("studentId") String studentId, @Param("month") String month);
    
    // ADD THIS METHOD for class-specific total
    @Query("SELECT COALESCE(SUM(fp.amountPaid), 0) FROM FeePayment fp WHERE fp.student.studentId = :studentId AND fp.month = :month AND fp.schoolClass.id = :classId")
    BigDecimal findTotalPaidByStudentAndMonthAndClass(@Param("studentId") String studentId, @Param("month") String month, @Param("classId") Long classId);
    
    @Query("SELECT fp FROM FeePayment fp WHERE fp.paymentDate BETWEEN :startDate AND :endDate ORDER BY fp.paymentDate DESC")
    List<FeePayment> findPaymentsBetweenDates(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // ADD THIS METHOD - it was missing but being used in the service
    @Query("SELECT fp FROM FeePayment fp WHERE fp.paymentDate >= :startDate ORDER BY fp.paymentDate DESC")
    List<FeePayment> findRecentPayments(@Param("startDate") LocalDate startDate);
    
    @Query("SELECT fp.student.studentId, SUM(fp.amountPaid) FROM FeePayment fp WHERE fp.month = :month GROUP BY fp.student.studentId")
    List<Object[]> findMonthlyPayments(@Param("month") String month);
    
    // UPDATE THIS METHOD to include classId
    boolean existsByStudentStudentIdAndMonthAndSchoolClassId(String studentId, String month, Long classId);
    
    // ADDITIONAL HELPER METHODS
    List<FeePayment> findBySchoolClassIdOrderByPaymentDateDesc(Long classId);
    
    @Query("SELECT COUNT(fp) FROM FeePayment fp WHERE fp.student.studentId = :studentId AND fp.month = :month")
    Long countPaymentsByStudentAndMonth(@Param("studentId") String studentId, @Param("month") String month);
    
    @Query("SELECT fp FROM FeePayment fp WHERE fp.month = :month ORDER BY fp.paymentDate DESC")
    List<FeePayment> findByMonthOrderByPaymentDateDesc(@Param("month") String month);
    
    // Get total collected amount for statistics
    @Query("SELECT COALESCE(SUM(fp.amountPaid), 0) FROM FeePayment fp")
    BigDecimal findTotalCollectedAmount();
    
    // Get recent payments count for statistics
    @Query("SELECT COUNT(fp) FROM FeePayment fp WHERE fp.paymentDate >= :startDate")
    Long countRecentPayments(@Param("startDate") LocalDate startDate);
    
    @Query("SELECT p FROM FeePayment p LEFT JOIN FETCH p.student LEFT JOIN FETCH p.schoolClass WHERE p.id = :id")
    Optional<FeePayment> findByIdWithDetails(@Param("id") Long id);
}