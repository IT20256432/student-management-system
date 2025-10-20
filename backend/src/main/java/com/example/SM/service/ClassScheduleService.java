package com.example.SM.service;

import com.example.SM.entity.ClassSchedule;
import com.example.SM.entity.SchoolClass;
import com.example.SM.repository.ClassScheduleRepository;
import com.example.SM.repository.SchoolClassRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

@Service
public class ClassScheduleService {
    
    @Autowired
    private ClassScheduleRepository classScheduleRepository;
    
    @Autowired
    private SchoolClassRepository schoolClassRepository;
    
    public List<ClassSchedule> getSchedulesByClass(Long classId) {
        return classScheduleRepository.findByClassId(classId);
    }
    
    public List<ClassSchedule> getTodaySchedulesByClass(Long classId) {
        DayOfWeek today = java.time.LocalDate.now().getDayOfWeek();
        return classScheduleRepository.findByClassIdAndDayOfWeek(classId, today);
    }
    
    public ClassSchedule createSchedule(ClassSchedule schedule) {
        List<ClassSchedule> existingSchedules = classScheduleRepository.findBySchoolClassAndDayOfWeek(
            schedule.getSchoolClass(), schedule.getDayOfWeek());
        
        for (ClassSchedule existing : existingSchedules) {
            if (hasTimeConflict(existing, schedule)) {
                throw new RuntimeException("Time conflict with existing schedule: " + existing.getSubject());
            }
        }
        
        return classScheduleRepository.save(schedule);
    }
    
    private boolean hasTimeConflict(ClassSchedule existing, ClassSchedule newSchedule) {
        return !(newSchedule.getEndTime().isBefore(existing.getStartTime()) || 
                newSchedule.getStartTime().isAfter(existing.getEndTime()));
    }
    
    public void deleteSchedule(Long scheduleId) {
        classScheduleRepository.deleteById(scheduleId);
    }
    
    public ClassSchedule updateSchedule(Long id, ClassSchedule scheduleDetails) {
        Optional<ClassSchedule> existingSchedule = classScheduleRepository.findById(id);
        if (existingSchedule.isPresent()) {
            ClassSchedule schedule = existingSchedule.get();
            schedule.setDayOfWeek(scheduleDetails.getDayOfWeek());
            schedule.setStartTime(scheduleDetails.getStartTime());
            schedule.setEndTime(scheduleDetails.getEndTime());
            schedule.setSubject(scheduleDetails.getSubject());
            return classScheduleRepository.save(schedule);
        }
        throw new RuntimeException("Schedule not found with id: " + id);
    }
}