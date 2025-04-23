package com.schoolems.schoolems.controller;

import com.schoolems.schoolems.dto.AuthRequest;
import com.schoolems.schoolems.dto.AuthResponse;
import com.schoolems.schoolems.dto.UserRegistrationDto;
import com.schoolems.schoolems.dto.UserResponse;
import com.schoolems.schoolems.entity.User;
import com.schoolems.schoolems.repository.UserRepository;
import com.schoolems.schoolems.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

private final AuthService authService;
private final UserRepository userRepository;


    public AuthController(AuthService authService, UserRepository userRepository){

        this.authService = authService;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registerUser(@RequestBody UserRegistrationDto registrationDto) {
        AuthRequest authRequest = new AuthRequest();
        authRequest.setName(registrationDto.getName());
        authRequest.setEmail(registrationDto.getEmail());
        authRequest.setPassword(registrationDto.getPassword());
        authRequest.setRole(registrationDto.getRole());

        return ResponseEntity.ok(authService.register(authRequest));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletRequest request, Authentication authentication) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            authService.logout(token);
        }
        return ResponseEntity.ok("Logged out successfully");
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(UserResponse.fromUser(user));
    }
}