package com.school.management.controller;

import com.school.management.entity.User;
import com.school.management.payload.AuthRequest;
import com.school.management.payload.AuthResponse;
import com.school.management.payload.RegisterRequest;
import com.school.management.payload.ChangePasswordRequest;
import com.school.management.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Auth service is running");
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        System.out.println("[DEBUG] AuthController: Login attempt for username: " + request.getUsername());
        try {
            AuthService.AuthResult result = authService.authenticateAndReturnUser(request.getUsername(), request.getPassword());
            if (result == null) {
                System.out.println("[DEBUG] AuthController: Authentication failed for username: " + request.getUsername());
                return ResponseEntity.status(401).build();
            }
            User user = result.user;
            String userRole = user.getRoles().stream().findFirst().map(role -> role.getName()).orElse("");
            String employeeId = user.getEmployee() != null ? user.getEmployee().getEmployeeId() : null;
            Long employeeDbId = user.getEmployee() != null ? user.getEmployee().getId() : null;
            System.out.println("[DEBUG] AuthController: Login successful for username: " + request.getUsername() + ", role: " + userRole);
            return ResponseEntity.ok(new AuthResponse(result.token, user.getUsername(), userRole, employeeId, employeeDbId));
        } catch (Exception e) {
            System.out.println("[DEBUG] AuthController: Login error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(new AuthResponse("", "", "", null, null));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        System.out.println("[DEBUG] AuthController: Registration attempt for username: " + request.getUsername());
        try {
            User created = authService.registerNewUser(request);
            if (created == null) {
                System.out.println("[DEBUG] AuthController: Registration failed - user creation returned null");
                return ResponseEntity.badRequest().body(new AuthResponse("", "", "", null, null));
            }
            String userRole = created.getRoles().stream().findFirst().map(role -> role.getName()).orElse("");
            String employeeId = created.getEmployee() != null ? created.getEmployee().getEmployeeId() : null;
            Long employeeDbId = created.getEmployee() != null ? created.getEmployee().getId() : null;
            // Generate JWT token for the newly registered user
            String token = authService.generateTokenForUser(created);
            System.out.println("[DEBUG] AuthController: Registration successful for username: " + request.getUsername());
            return ResponseEntity.ok(new AuthResponse(token, created.getUsername(), userRole, employeeId, employeeDbId));
        } catch (Exception e) {
            System.out.println("[DEBUG] AuthController: Registration error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(new AuthResponse("", "", "", null, null));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam("email") String email) {
        boolean sent = authService.initiatePasswordReset(email);
        if (!sent) {
            return ResponseEntity.badRequest().body("Email address not found or not valid.");
        }
        return ResponseEntity.ok("Password reset link sent to email if account exists.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @RequestParam("token") String token,
            @RequestParam("newPassword") String newPassword
    ) {
        boolean result = authService.resetPassword(token, newPassword);
        if (!result) {
            return ResponseEntity.badRequest().body("Invalid or expired reset token.");
        }
        return ResponseEntity.ok("Password changed successfully.");
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("User not authenticated");
        }

        String username = authentication.getName();
        boolean result = authService.changePassword(username, request.getCurrentPassword(), request.getNewPassword());

        if (!result) {
            return ResponseEntity.badRequest().body("Current password is incorrect or password change failed");
        }

        return ResponseEntity.ok("Password changed successfully");
    }
}
