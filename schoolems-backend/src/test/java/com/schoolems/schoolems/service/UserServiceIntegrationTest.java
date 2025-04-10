package com.schoolems.schoolems.service;

import com.schoolems.schoolems.SchoolemsApplication;
import com.schoolems.schoolems.dto.UserRegistrationDto;
import com.schoolems.schoolems.entity.User;
import com.schoolems.schoolems.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockitoPostProcessor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest(classes = SchoolemsApplication.class)
@ActiveProfiles("test")
class UserServiceIntegrationTest {

    @Autowired
    private UserService userService;

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setup() {
        // Create and inject mocks manually
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);

        // This requires your UserService to use constructor injection
        userService = new UserService(userRepository, passwordEncoder);
    }

    @Test
    void registerUser_ShouldEncodePassword() {
        // ... same test implementation as above ...
    }
}