package com.example.SM.repository;

import com.example.SM.entity.Attendance;
import com.example.SM.entity.AttendanceSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByStudentIdOrderByAttendanceDateDesc(String studentId);
    List<Attendance> findByAttendanceDateOrderByScanTimeAsc(LocalDate attendanceDate);
    Optional<Attendance> findByStudentIdAndAttendanceDate(String studentId, LocalDate attendanceDate);
    boolean existsByStudentIdAndAttendanceDate(String studentId, LocalDate attendanceDate);
    
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.studentId = :studentId AND a.status IN ('PRESENT', 'LATE')")
    Long countPresentDaysByStudentId(String studentId);
    
    // NEW: Session-based queries
    boolean existsByStudentIdAndAttendanceSession(String studentId, AttendanceSession session);
    List<Attendance> findByAttendanceSessionOrderByScanTimeAsc(AttendanceSession session);
    Optional<Attendance> findByStudentIdAndAttendanceSession(String studentId, AttendanceSession session);
    
    @Query("SELECT a FROM Attendance a WHERE a.attendanceSession.id = :sessionId ORDER BY a.scanTime")
    List<Attendance> findBySessionId(Long sessionId);
}