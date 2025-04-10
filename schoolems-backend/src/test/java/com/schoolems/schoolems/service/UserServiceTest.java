package com.schoolems.schoolems.service;

import com.schoolems.schoolems.dto.UserRegistrationDto;
import com.schoolems.schoolems.entity.User;
import com.schoolems.schoolems.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    void registerUser_ShouldSuccessfullyRegisterUser() {
        // Arrange
        UserRegistrationDto dto = new UserRegistrationDto();
        dto.setEmail("test@example.com");
        dto.setPassword("password123");
        dto.setRole("EMPLOYEE");

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        User result = userService.registerUser(dto);

        // Assert
        assertNotNull(result);
        assertEquals("test@example.com", result.getEmail());
        assertEquals("encodedPassword", result.getPassword());
        assertEquals("EMPLOYEE", result.getRole());
        verify(userRepository).existsByEmail("test@example.com");
        verify(passwordEncoder).encode("password123");
    }

    @Test
    void registerUser_ShouldThrowWhenEmailExists() {
        // Arrange
        UserRegistrationDto dto = new UserRegistrationDto();
        dto.setEmail("exists@test.com");
        dto.setPassword("password123");
        dto.setRole("EMPLOYEE");

        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            userService.registerUser(dto);
        });
        verify(userRepository, never()).save(any());
    }

    @Test
    void registerUser_ShouldValidatePasswordLength() {
        UserRegistrationDto dto = new UserRegistrationDto();
        dto.setEmail("test@example.com");
        dto.setRole("EMPLOYEE");

        assertThrows(IllegalArgumentException.class, () -> {
            dto.setPassword("securePass1");
        });
    }

    @Test
    void registerUser_ShouldValidateRole() {
        UserRegistrationDto dto = new UserRegistrationDto();
        dto.setEmail("test@example.com");
        dto.setPassword("validPassword123");

        assertThrows(IllegalArgumentException.class, () -> {
            dto.setRole("INVALID_ROLE"); // Should trigger the validation
        });
    }

    @Test
    void registerUser_ShouldWorkWithValidData() {
        UserRegistrationDto dto = new UserRegistrationDto();
        dto.setEmail("test@example.com");
        dto.setPassword("validPassword123");
        dto.setRole("EMPLOYEE");

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = userService.registerUser(dto);

        assertNotNull(result);
        assertEquals("encodedPassword", result.getPassword());
    }
}
