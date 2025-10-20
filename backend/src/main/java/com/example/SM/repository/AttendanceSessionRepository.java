package com.example.SM.repository;

import com.example.SM.entity.AttendanceSession;
import com.example.SM.entity.SchoolClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    List<AttendanceSession> findBySchoolClassAndDate(SchoolClass schoolClass, LocalDate date);
    List<AttendanceSession> findByDateAndStatus(LocalDate date, AttendanceSession.SessionStatus status);
    
    @Query("SELECT s FROM AttendanceSession s WHERE s.date = :date AND s.status = 'ACTIVE'")
    List<AttendanceSession> findActiveSessionsByDate(LocalDate date);
    
    @Query("SELECT s FROM AttendanceSession s WHERE s.date = CURRENT_DATE AND s.status = 'ACTIVE'")
    List<AttendanceSession> findTodayActiveSessions();
    
    @Query("SELECT s FROM AttendanceSession s WHERE s.schoolClass.id = :classId AND s.date = :date AND s.subject = :subject")
    Optional<AttendanceSession> findByClassAndDateAndSubject(Long classId, LocalDate date, String subject);
    
    @Query("SELECT s FROM AttendanceSession s WHERE s.date = CURRENT_DATE AND s.scheduledStartTime <= :currentTime AND s.scheduledEndTime >= :currentTime AND s.status = 'SCHEDULED'")
    List<AttendanceSession> findSessionsToStart(LocalTime currentTime);
    
    @Query("SELECT s FROM AttendanceSession s WHERE s.date = CURRENT_DATE AND s.scheduledEndTime <= :currentTime AND s.status = 'ACTIVE'")
    List<AttendanceSession> findSessionsToEnd(LocalTime currentTime);
}