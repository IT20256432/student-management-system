package com.example.SM.controller;

import com.example.SM.entity.ClassSchedule;
import com.example.SM.service.ClassScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/schedules")
@CrossOrigin(origins = "http://localhost:3000")
public class ClassScheduleController {
    
    @Autowired
    private ClassScheduleService classScheduleService;
    
    @GetMapping("/class/{classId}")
    public List<ClassSchedule> getSchedulesByClass(@PathVariable Long classId) {
        return classScheduleService.getSchedulesByClass(classId);
    }
    
    @GetMapping("/class/{classId}/today")
    public List<ClassSchedule> getTodaySchedulesByClass(@PathVariable Long classId) {
        return classScheduleService.getTodaySchedulesByClass(classId);
    }
    
    @PostMapping
    public ResponseEntity<?> createSchedule(@RequestBody ClassSchedule schedule) {
        try {
            ClassSchedule createdSchedule = classScheduleService.createSchedule(schedule);
            return ResponseEntity.ok(createdSchedule);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateSchedule(@PathVariable Long id, @RequestBody ClassSchedule schedule) {
        try {
            ClassSchedule updatedSchedule = classScheduleService.updateSchedule(id, schedule);
            return ResponseEntity.ok(updatedSchedule);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteSchedule(@PathVariable Long id) {
        try {
            classScheduleService.deleteSchedule(id);
            Map<String, Boolean> response = new HashMap<>();
            response.put("deleted", true);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}