package com.school.management.service;

import com.school.management.entity.Employee;
import com.school.management.entity.Role;
import com.school.management.entity.User;
import com.school.management.payload.RegisterRequest;
import com.school.management.repository.EmployeeRepository;
import com.school.management.repository.RoleRepository;
import com.school.management.repository.UserRepository;
import com.school.management.security.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private Employee testEmployee;
    private Role employeeRole;
    private RegisterRequest registerRequest;

    @BeforeEach
    void setUp() {
        // Setup test data
        employeeRole = new Role();
        employeeRole.setId(1L);
        employeeRole.setName("EMPLOYEE");

        testEmployee = Employee.builder()
                .id(1L)
                .employeeId("EMP001")
                .name("John Doe")
                .department("IT")
                .position("Developer")
                .contactInfo("john.doe@company.com")
                .startDate(LocalDate.now())
                .build();

        testUser = User.builder()
                .id(1L)
                .username("johndoe")
                .password("hashedPassword")
                .email("john.doe@company.com")
                .roles(Set.of(employeeRole))
                .employee(testEmployee)
                .build();

        registerRequest = new RegisterRequest();
        registerRequest.setUsername("johndoe");
        registerRequest.setPassword("password123");
        registerRequest.setEmail("john.doe@company.com");
        registerRequest.setRoles(List.of("EMPLOYEE"));
        registerRequest.setEmployeeId("EMP001");
        registerRequest.setName("John Doe");
        registerRequest.setDepartment("IT");
        registerRequest.setPosition("Developer");
        registerRequest.setContactInfo("john.doe@company.com");
        registerRequest.setStartDate(LocalDate.now());
    }

    @Test
    void authenticateAndGenerateToken_WithValidCredentials_ReturnsToken() {
        // Arrange
        String username = "johndoe";
        String password = "password123";
        String expectedToken = "jwt-token";

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(password, testUser.getPassword())).thenReturn(true);
        when(jwtUtils.generateToken(testUser)).thenReturn(expectedToken);

        // Act
        String result = authService.authenticateAndGenerateToken(username, password);

        // Assert
        assertEquals(expectedToken, result);
        verify(userRepository).findByUsername(username);
        verify(passwordEncoder).matches(password, testUser.getPassword());
        verify(jwtUtils).generateToken(testUser);
    }

    @Test
    void authenticateAndGenerateToken_WithInvalidUsername_ReturnsNull() {
        // Arrange
        String username = "nonexistent";
        String password = "password123";

        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        // Act
        String result = authService.authenticateAndGenerateToken(username, password);

        // Assert
        assertNull(result);
        verify(userRepository).findByUsername(username);
        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(jwtUtils, never()).generateToken(any());
    }

    @Test
    void authenticateAndGenerateToken_WithInvalidPassword_ReturnsNull() {
        // Arrange
        String username = "johndoe";
        String password = "wrongpassword";

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(password, testUser.getPassword())).thenReturn(false);

        // Act
        String result = authService.authenticateAndGenerateToken(username, password);

        // Assert
        assertNull(result);
        verify(userRepository).findByUsername(username);
        verify(passwordEncoder).matches(password, testUser.getPassword());
        verify(jwtUtils, never()).generateToken(any());
    }

    @Test
    void registerNewUser_WithValidData_ReturnsUser() {
        // Arrange
        when(userRepository.findByUsername(registerRequest.getUsername())).thenReturn(Optional.empty());
        when(roleRepository.findByName("EMPLOYEE")).thenReturn(Optional.of(employeeRole));
        when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("hashedPassword");
        when(employeeRepository.save(any(Employee.class))).thenReturn(testEmployee);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = authService.registerNewUser(registerRequest);

        // Assert
        assertNotNull(result);
        assertEquals(testUser.getUsername(), result.getUsername());
        verify(userRepository).findByUsername(registerRequest.getUsername());
        verify(roleRepository).findByName("EMPLOYEE");
        verify(passwordEncoder).encode(registerRequest.getPassword());
        verify(employeeRepository).save(any(Employee.class));
        verify(userRepository).save(any(User.class));
    }

    @Test
    void registerNewUser_WithExistingUsername_ReturnsNull() {
        // Arrange
        when(userRepository.findByUsername(registerRequest.getUsername())).thenReturn(Optional.of(testUser));

        // Act
        User result = authService.registerNewUser(registerRequest);

        // Assert
        assertNull(result);
        verify(userRepository).findByUsername(registerRequest.getUsername());
        verify(roleRepository, never()).findByName(anyString());
        verify(employeeRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void changePassword_WithValidCredentials_ReturnsTrue() {
        // Arrange
        String username = "johndoe";
        String currentPassword = "currentPassword";
        String newPassword = "newPassword123";

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(currentPassword, testUser.getPassword())).thenReturn(true);
        when(passwordEncoder.encode(newPassword)).thenReturn("newHashedPassword");
        when(userRepository.save(testUser)).thenReturn(testUser);

        // Act
        boolean result = authService.changePassword(username, currentPassword, newPassword);

        // Assert
        assertTrue(result);
        verify(userRepository).findByUsername(username);
        verify(passwordEncoder).matches(currentPassword, testUser.getPassword());
        verify(passwordEncoder).encode(newPassword);
        verify(userRepository).save(testUser);
    }

    @Test
    void changePassword_WithInvalidCurrentPassword_ReturnsFalse() {
        // Arrange
        String username = "johndoe";
        String currentPassword = "wrongPassword";
        String newPassword = "newPassword123";

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(currentPassword, testUser.getPassword())).thenReturn(false);

        // Act
        boolean result = authService.changePassword(username, currentPassword, newPassword);

        // Assert
        assertFalse(result);
        verify(userRepository).findByUsername(username);
        verify(passwordEncoder).matches(currentPassword, testUser.getPassword());
        verify(passwordEncoder, never()).encode(newPassword);
        verify(userRepository, never()).save(any());
    }

    @Test
    void changePassword_WithShortNewPassword_ReturnsFalse() {
        // Arrange
        String username = "johndoe";
        String currentPassword = "currentPassword";
        String newPassword = "123"; // Too short

        // Act
        boolean result = authService.changePassword(username, currentPassword, newPassword);

        // Assert
        assertFalse(result);
        verify(userRepository, never()).findByUsername(anyString());
    }

    @Test
    void changePassword_WithNonexistentUser_ReturnsFalse() {
        // Arrange
        String username = "nonexistent";
        String currentPassword = "currentPassword";
        String newPassword = "newPassword123";

        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        // Act
        boolean result = authService.changePassword(username, currentPassword, newPassword);

        // Assert
        assertFalse(result);
        verify(userRepository).findByUsername(username);
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void registerNewUser_WithAdminRole_CreatesEmployeeRecord() {
        // Arrange
        Role adminRole = new Role();
        adminRole.setId(2L);
        adminRole.setName("ADMIN");

        registerRequest.setRoles(List.of("ADMIN"));

        when(userRepository.findByUsername(registerRequest.getUsername())).thenReturn(Optional.empty());
        when(roleRepository.findByName("ADMIN")).thenReturn(Optional.of(adminRole));
        when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("hashedPassword");
        when(employeeRepository.save(any(Employee.class))).thenReturn(testEmployee);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = authService.registerNewUser(registerRequest);

        // Assert
        assertNotNull(result);
        verify(employeeRepository).save(any(Employee.class)); // Employee record should be created for ADMIN too
    }

    @Test
    void authenticateAndReturnUser_WithValidCredentials_ReturnsAuthResult() {
        // Arrange
        String username = "johndoe";
        String password = "password123";
        String expectedToken = "jwt-token";

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(password, testUser.getPassword())).thenReturn(true);
        when(jwtUtils.generateToken(testUser)).thenReturn(expectedToken);

        // Act
        AuthService.AuthResult result = authService.authenticateAndReturnUser(username, password);

        // Assert
        assertNotNull(result);
        assertEquals(expectedToken, result.token);
        assertEquals(testUser, result.user);
        verify(userRepository).findByUsername(username);
        verify(passwordEncoder).matches(password, testUser.getPassword());
        verify(jwtUtils).generateToken(testUser);
    }

    @Test
    void authenticateAndReturnUser_WithInvalidCredentials_ReturnsNull() {
        // Arrange
        String username = "johndoe";
        String password = "wrongpassword";

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(password, testUser.getPassword())).thenReturn(false);

        // Act
        AuthService.AuthResult result = authService.authenticateAndReturnUser(username, password);

        // Assert
        assertNull(result);
        verify(userRepository).findByUsername(username);
        verify(passwordEncoder).matches(password, testUser.getPassword());
        verify(jwtUtils, never()).generateToken(any());
    }

    @Test
    void initiatePasswordReset_WithValidEmail_ReturnsTrue() {
        // Arrange
        String email = "john.doe@company.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        boolean result = authService.initiatePasswordReset(email);

        // Assert
        assertTrue(result);
        verify(userRepository).findByEmail(email);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void initiatePasswordReset_WithInvalidEmail_ReturnsFalse() {
        // Arrange
        String email = "invalid-email";

        // Act
        boolean result = authService.initiatePasswordReset(email);

        // Assert
        assertFalse(result);
        verify(userRepository, never()).findByEmail(anyString());
        verify(userRepository, never()).save(any());
    }

    @Test
    void initiatePasswordReset_WithNonexistentEmail_ReturnsFalse() {
        // Arrange
        String email = "nonexistent@company.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        // Act
        boolean result = authService.initiatePasswordReset(email);

        // Assert
        assertFalse(result);
        verify(userRepository).findByEmail(email);
        verify(userRepository, never()).save(any());
    }

    @Test
    void initiatePasswordReset_WithNullEmail_ReturnsFalse() {
        // Act
        boolean result = authService.initiatePasswordReset(null);

        // Assert
        assertFalse(result);
        verify(userRepository, never()).findByEmail(anyString());
    }

    @Test
    void resetPassword_WithValidToken_ReturnsTrue() {
        // Arrange
        String token = "valid-reset-token";
        String newPassword = "newPassword123";

        testUser.setResetToken(token);
        testUser.setResetTokenExpiry(java.time.Instant.now().plusSeconds(3600));

        when(userRepository.findByResetToken(token)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.encode(newPassword)).thenReturn("newHashedPassword");
        when(userRepository.save(testUser)).thenReturn(testUser);

        // Act
        boolean result = authService.resetPassword(token, newPassword);

        // Assert
        assertTrue(result);
        verify(userRepository).findByResetToken(token);
        verify(passwordEncoder).encode(newPassword);
        verify(userRepository).save(testUser);
        assertNull(testUser.getResetToken());
        assertNull(testUser.getResetTokenExpiry());
    }

    @Test
    void resetPassword_WithExpiredToken_ReturnsFalse() {
        // Arrange
        String token = "expired-token";
        String newPassword = "newPassword123";

        testUser.setResetToken(token);
        testUser.setResetTokenExpiry(java.time.Instant.now().minusSeconds(3600));

        when(userRepository.findByResetToken(token)).thenReturn(Optional.of(testUser));

        // Act
        boolean result = authService.resetPassword(token, newPassword);

        // Assert
        assertFalse(result);
        verify(userRepository).findByResetToken(token);
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any());
    }

    @Test
    void resetPassword_WithInvalidToken_ReturnsFalse() {
        // Arrange
        String token = "invalid-token";
        String newPassword = "newPassword123";

        when(userRepository.findByResetToken(token)).thenReturn(Optional.empty());

        // Act
        boolean result = authService.resetPassword(token, newPassword);

        // Assert
        assertFalse(result);
        verify(userRepository).findByResetToken(token);
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any());
    }

    @Test
    void resetPassword_WithShortPassword_ReturnsFalse() {
        // Arrange
        String token = "valid-token";
        String newPassword = "123";

        // Act
        boolean result = authService.resetPassword(token, newPassword);

        // Assert
        assertFalse(result);
        verify(userRepository, never()).findByResetToken(anyString());
    }

    @Test
    void resetPassword_WithNullParameters_ReturnsFalse() {
        // Act & Assert
        assertFalse(authService.resetPassword(null, "newPassword123"));
        assertFalse(authService.resetPassword("token", null));
        assertFalse(authService.resetPassword(null, null));

        verify(userRepository, never()).findByResetToken(anyString());
    }

    @Test
    void registerNewUser_WithDefaultRole_AssignsEmployeeRole() {
        // Arrange
        registerRequest.setRoles(null);

        when(userRepository.findByUsername(registerRequest.getUsername())).thenReturn(Optional.empty());
        when(roleRepository.findByName("EMPLOYEE")).thenReturn(Optional.of(employeeRole));
        when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("hashedPassword");
        when(employeeRepository.save(any(Employee.class))).thenReturn(testEmployee);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = authService.registerNewUser(registerRequest);

        // Assert
        assertNotNull(result);
        verify(roleRepository).findByName("EMPLOYEE");
    }

    @Test
    void registerNewUser_WithEmptyRolesList_AssignsEmployeeRole() {
        // Arrange
        registerRequest.setRoles(List.of());

        when(userRepository.findByUsername(registerRequest.getUsername())).thenReturn(Optional.empty());
        when(roleRepository.findByName("EMPLOYEE")).thenReturn(Optional.of(employeeRole));
        when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("hashedPassword");
        when(employeeRepository.save(any(Employee.class))).thenReturn(testEmployee);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = authService.registerNewUser(registerRequest);

        // Assert
        assertNotNull(result);
        verify(roleRepository).findByName("EMPLOYEE");
    }

    @Test
    void registerNewUser_WithoutEmployeeInfo_CreatesUserWithoutEmployee() {
        // Arrange
        registerRequest.setName(null);
        registerRequest.setEmployeeId(null);

        when(userRepository.findByUsername(registerRequest.getUsername())).thenReturn(Optional.empty());
        when(roleRepository.findByName("EMPLOYEE")).thenReturn(Optional.of(employeeRole));
        when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = authService.registerNewUser(registerRequest);

        // Assert
        assertNotNull(result);
        verify(employeeRepository, never()).save(any(Employee.class));
        verify(userRepository).save(any(User.class));
    }
}
