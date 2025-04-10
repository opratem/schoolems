package com.schoolems.schoolems.service;

import com.schoolems.schoolems.dto.UserRegistrationDto;
import com.schoolems.schoolems.entity.User;
import com.schoolems.schoolems.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; // Use interface instead of concrete class

    public User registerUser(UserRegistrationDto dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = User.builder()
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .role(dto.getRole()) // Make sure your DTO has this field
                .build();

        return userRepository.save(user);
    }
}