package com.example.SM.service;

import com.example.SM.entity.AttendanceSession;
import com.example.SM.entity.ClassSchedule;
import com.example.SM.entity.SchoolClass;
import com.example.SM.repository.AttendanceSessionRepository;
import com.example.SM.repository.ClassScheduleRepository;
import com.example.SM.repository.SchoolClassRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
public class AttendanceSessionService {
    
    @Autowired
    private AttendanceSessionRepository attendanceSessionRepository;
    
    @Autowired
    private SchoolClassRepository schoolClassRepository;
    
    @Autowired
    private ClassScheduleService classScheduleService;
    
    public List<AttendanceSession> getActiveSessions() {
        return attendanceSessionRepository.findTodayActiveSessions();
    }
    
    public List<AttendanceSession> getSessionsByClassAndDate(Long classId, LocalDate date) {
        Optional<SchoolClass> schoolClass = schoolClassRepository.findById(classId);
        if (schoolClass.isPresent()) {
            return attendanceSessionRepository.findBySchoolClassAndDate(schoolClass.get(), date);
        }
        throw new RuntimeException("Class not found with id: " + classId);
    }
    
    public AttendanceSession startSession(Long sessionId) {
        Optional<AttendanceSession> sessionOpt = attendanceSessionRepository.findById(sessionId);
        if (sessionOpt.isPresent()) {
            AttendanceSession session = sessionOpt.get();
            session.setStatus(AttendanceSession.SessionStatus.ACTIVE);
            session.setActualStartTime(LocalTime.now());
            return attendanceSessionRepository.save(session);
        }
        throw new RuntimeException("Session not found with id: " + sessionId);
    }
    
    public AttendanceSession endSession(Long sessionId) {
        Optional<AttendanceSession> sessionOpt = attendanceSessionRepository.findById(sessionId);
        if (sessionOpt.isPresent()) {
            AttendanceSession session = sessionOpt.get();
            session.setStatus(AttendanceSession.SessionStatus.COMPLETED);
            session.setActualEndTime(LocalTime.now());
            return attendanceSessionRepository.save(session);
        }
        throw new RuntimeException("Session not found with id: " + sessionId);
    }
    
    public AttendanceSession createSession(AttendanceSession session) {
        return attendanceSessionRepository.save(session);
    }
    
    @Scheduled(cron = "0 0 0 * * ?")
    public void createDailySessions() {
        LocalDate today = LocalDate.now();
        DayOfWeek todayDay = today.getDayOfWeek();
        
        List<SchoolClass> activeClasses = schoolClassRepository.findByActiveTrue();
        
        for (SchoolClass schoolClass : activeClasses) {
            List<ClassSchedule> todaySchedules = classScheduleService.getTodaySchedulesByClass(schoolClass.getId());
            
            for (ClassSchedule schedule : todaySchedules) {
                Optional<AttendanceSession> existingSession = 
                    attendanceSessionRepository.findByClassAndDateAndSubject(
                        schoolClass.getId(), today, schedule.getSubject());
                
                if (existingSession.isEmpty()) {
                    AttendanceSession session = new AttendanceSession(
                        schoolClass, today, schedule.getStartTime(), 
                        schedule.getEndTime(), schedule.getSubject()
                    );
                    attendanceSessionRepository.save(session);
                }
            }
        }
    }
    
    @Scheduled(cron = "0 * * * * ?")
    public void autoStartSessions() {
        LocalTime currentTime = LocalTime.now();
        List<AttendanceSession> sessionsToStart = 
            attendanceSessionRepository.findSessionsToStart(currentTime);
        
        for (AttendanceSession session : sessionsToStart) {
            session.setStatus(AttendanceSession.SessionStatus.ACTIVE);
            session.setActualStartTime(currentTime);
            attendanceSessionRepository.save(session);
        }
    }
    
    @Scheduled(cron = "0 * * * * ?")
    public void autoEndSessions() {
        LocalTime currentTime = LocalTime.now();
        List<AttendanceSession> sessionsToEnd = 
            attendanceSessionRepository.findSessionsToEnd(currentTime);
        
        for (AttendanceSession session : sessionsToEnd) {
            session.setStatus(AttendanceSession.SessionStatus.COMPLETED);
            session.setActualEndTime(currentTime);
            attendanceSessionRepository.save(session);
        }
    }
}