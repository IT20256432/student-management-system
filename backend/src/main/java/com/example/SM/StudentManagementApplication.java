package com.example.SM;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.example.SM.entity.User;
import com.example.SM.repository.UserRepository;

@SpringBootApplication
@EnableScheduling
public class StudentManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(StudentManagementApplication.class, args);
        System.out.println("🚀 Student Management System Started Successfully!");
        System.out.println("📍 Application running on: http://localhost:8080");
        System.out.println("🔑 JWT Authentication System: ACTIVE");
    }

    @Bean
    public CommandLineRunner initData(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            System.out.println("🔧 Initializing default users...");
            
            // Create default admin user
            if (userRepository.findByUsername("admin").isEmpty()) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole("ADMIN");
                admin.setEmail("admin@sammana.edu.lk");
                admin.setFullName("System Administrator");
                admin.setActive(true);
                userRepository.save(admin);
                System.out.println("✅ Default admin user created - username: admin, password: admin123");
            } else {
                System.out.println("ℹ️  Admin user already exists");
            }

            // Create default teacher user
            if (userRepository.findByUsername("teacher1").isEmpty()) {
                User teacher = new User();
                teacher.setUsername("teacher1");
                teacher.setPassword(passwordEncoder.encode("teacher123"));
                teacher.setRole("TEACHER");
                teacher.setEmail("teacher1@sammana.edu.lk");
                teacher.setFullName("John Smith");
                teacher.setActive(true);
                userRepository.save(teacher);
                System.out.println("✅ Default teacher user created - username: teacher1, password: teacher123");
            } else {
                System.out.println("ℹ️  Teacher user already exists");
            }

            // Create default student user
            if (userRepository.findByUsername("student1").isEmpty()) {
                User student = new User();
                student.setUsername("student1");
                student.setPassword(passwordEncoder.encode("student123"));
                student.setRole("STUDENT");
                student.setEmail("student1@sammana.edu.lk");
                student.setFullName("Alice Johnson");
                student.setActive(true);
                userRepository.save(student);
                System.out.println("✅ Default student user created - username: student1, password: student123");
            } else {
                System.out.println("ℹ️  Student user already exists");
            }

            // Create additional demo users
            if (userRepository.findByUsername("principal").isEmpty()) {
                User principal = new User();
                principal.setUsername("principal");
                principal.setPassword(passwordEncoder.encode("principal123"));
                principal.setRole("ADMIN");
                principal.setEmail("principal@sammana.edu.lk");
                principal.setFullName("Dr. Robert Wilson");
                principal.setActive(true);
                userRepository.save(principal);
                System.out.println("✅ Principal user created - username: principal, password: principal123");
            } else {
                System.out.println("ℹ️  Principal user already exists");
            }

            // Create finance user
            if (userRepository.findByUsername("finance").isEmpty()) {
                User finance = new User();
                finance.setUsername("finance");
                finance.setPassword(passwordEncoder.encode("finance123"));
                finance.setRole("ADMIN");
                finance.setEmail("finance@sammana.edu.lk");
                finance.setFullName("Sarah Chen - Finance Department");
                finance.setActive(true);
                userRepository.save(finance);
                System.out.println("✅ Finance user created - username: finance, password: finance123");
            } else {
                System.out.println("ℹ️  Finance user already exists");
            }

            // Create additional teacher
            if (userRepository.findByUsername("teacher2").isEmpty()) {
                User teacher2 = new User();
                teacher2.setUsername("teacher2");
                teacher2.setPassword(passwordEncoder.encode("teacher123"));
                teacher2.setRole("TEACHER");
                teacher2.setEmail("teacher2@sammana.edu.lk");
                teacher2.setFullName("Maria Garcia");
                teacher2.setActive(true);
                userRepository.save(teacher2);
                System.out.println("✅ Additional teacher user created - username: teacher2, password: teacher123");
            } else {
                System.out.println("ℹ️  Teacher2 user already exists");
            }

            System.out.println("\n🎯 Login System Ready!");
            System.out.println("==========================================");
            System.out.println("Available Demo Accounts:");
            System.out.println("==========================================");
            System.out.println("👨‍💼 ADMIN Accounts:");
            System.out.println("   • admin / admin123 (Full Access)");
            System.out.println("   • principal / principal123 (Administration)");
            System.out.println("   • finance / finance123 (Financial Access)");
            System.out.println("\n👨‍🏫 TEACHER Accounts:");
            System.out.println("   • teacher1 / teacher123 (John Smith)");
            System.out.println("   • teacher2 / teacher123 (Maria Garcia)");
            System.out.println("\n👩‍🎓 STUDENT Accounts:");
            System.out.println("   • student1 / student123 (Alice Johnson)");
            System.out.println("==========================================");
            System.out.println("\n🌐 API Endpoints:");
            System.out.println("   • Login: POST http://localhost:8080/api/auth/login");
            System.out.println("   • Students: GET http://localhost:8080/api/students");
            System.out.println("   • Classes: GET http://localhost:8080/api/classes");
            System.out.println("   • Debug: GET http://localhost:8080/api/debug/config");
            System.out.println("==========================================\n");
        };
    }
}