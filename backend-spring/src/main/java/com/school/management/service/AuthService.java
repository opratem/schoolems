package com.school.management.service;

import com.school.management.entity.User;
import com.school.management.entity.Employee;
import com.school.management.entity.Role;
import com.school.management.payload.AuthRequest;
import com.school.management.payload.RegisterRequest;
import com.school.management.repository.UserRepository;
import com.school.management.repository.EmployeeRepository;
import com.school.management.repository.RoleRepository;
import com.school.management.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;

import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;
    private final JwtUtils jwtUtils;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    // Helper result class for authentication result (token + user)
    public static class AuthResult {
        public final String token;
        public final User user;
        public AuthResult(String token, User user) { this.token = token; this.user = user; }
    }

    // User login: validate, then return JWT if correct
    public String authenticateAndGenerateToken(String username, String password) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) return null;
        User user = userOpt.get();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            return null;
        }
        return jwtUtils.generateToken(user);
    }

    public AuthResult authenticateAndReturnUser(String username, String password) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) return null;
        User user = userOpt.get();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            return null;
        }
        String token = jwtUtils.generateToken(user);
        return new AuthResult(token, user);
    }

    // Register a new user (with roles!)
    public User registerNewUser(RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) return null;
        // Optionally check for duplicate email, etc.

        Set<Role> userRoles = new HashSet<>();
        if (request.getRoles() == null || request.getRoles().isEmpty()) {
            // Default: EMPLOYEE
            userRoles.add(roleRepository.findByName("EMPLOYEE").orElseThrow());
        } else {
            for (String roleName : request.getRoles()) {
                userRoles.add(roleRepository.findByName(roleName.toUpperCase()).orElseThrow());
            }
        }

        // Create employee record for all users (not just EMPLOYEE role)
        Employee employee = null;
        if (request.getName() != null && request.getEmployeeId() != null) {
            employee = Employee.builder()
                    .employeeId(request.getEmployeeId().toString())
                    .name(request.getName())
                    .department(request.getDepartment())
                    .position(request.getPosition())
                    .contactInfo(request.getContactInfo())
                    .startDate(request.getStartDate())
                    .build();
            employee = employeeRepository.save(employee);
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .roles(userRoles)
                .employee(employee)
                .build();

        user = userRepository.save(user);
        return user;
    }

    // Generate token directly from User object (useful for registration)
    public String generateTokenForUser(User user) {
        return jwtUtils.generateToken(user);
    }

    // --- Password Reset ---
    public boolean initiatePasswordReset(String email) {
        if (email == null || !email.contains("@")) return false;
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return false;
        String token = java.util.UUID.randomUUID().toString();
        java.time.Instant expiry = java.time.Instant.now().plusSeconds(60 * 60); // 1h expiry
        user.setResetToken(token);
        user.setResetTokenExpiry(expiry);
        userRepository.save(user);
        // Compose reset email
        String link = "http://localhost:3000/reset-password?token=" + token;
        String subject = "Password Reset Request";
        String msg = "To reset your password, click the link below (valid for 1 hour):\n" + link;
        sendMail(user.getEmail(), subject, msg);
        return true;
    }

    public boolean resetPassword(String token, String newPassword) {
        if (token == null || newPassword == null || newPassword.length() < 6) return false;
        User user = userRepository.findByResetToken(token).orElse(null);
        if (user == null) return false;
        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(java.time.Instant.now())) return false;
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
        return true;
    }

    private void sendMail(String to, String subject, String body) {
        try {
            SimpleMailMessage mailMsg = new SimpleMailMessage();
            mailMsg.setTo(to);
            mailMsg.setSubject(subject);
            mailMsg.setText(body);
            mailSender.send(mailMsg);
        } catch (Exception e) {
            // Log error
            System.out.println("Email send failed: " + e.getMessage());
        }
    }

    // Change password for authenticated user
    public boolean changePassword(String username, String currentPassword, String newPassword) {
        if (username == null || currentPassword == null || newPassword == null) {
            return false;
        }

        if (newPassword.length() < 6) {
            return false;
        }

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();

        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return false;
        }

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return true;
    }
}
