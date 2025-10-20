package com.example.SM.repository;

import com.example.SM.entity.ClassSchedule;
import com.example.SM.entity.SchoolClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.util.List;

@Repository
public interface ClassScheduleRepository extends JpaRepository<ClassSchedule, Long> {
    List<ClassSchedule> findBySchoolClass(SchoolClass schoolClass);
    List<ClassSchedule> findBySchoolClassAndDayOfWeek(SchoolClass schoolClass, DayOfWeek dayOfWeek);
    
    @Query("SELECT cs FROM ClassSchedule cs WHERE cs.schoolClass.id = :classId")
    List<ClassSchedule> findByClassId(Long classId);
    
    @Query("SELECT cs FROM ClassSchedule cs WHERE cs.schoolClass.id = :classId AND cs.dayOfWeek = :dayOfWeek ORDER BY cs.startTime")
    List<ClassSchedule> findByClassIdAndDayOfWeek(Long classId, DayOfWeek dayOfWeek);
}