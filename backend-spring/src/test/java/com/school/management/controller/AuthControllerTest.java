package com.school.management.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.management.entity.Employee;
import com.school.management.entity.Role;
import com.school.management.entity.User;
import com.school.management.payload.AuthRequest;
import com.school.management.payload.ChangePasswordRequest;
import com.school.management.payload.RegisterRequest;
import com.school.management.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private Employee testEmployee;
    private Role testRole;
    private AuthRequest validAuthRequest;
    private RegisterRequest validRegisterRequest;
    private ChangePasswordRequest validChangePasswordRequest;

    @BeforeEach
    void setUp() {
        testRole = new Role();
        testRole.setId(1L);
        testRole.setName("EMPLOYEE");

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
                .email("john.doe@company.com")
                .password("hashedPassword")
                .roles(Set.of(testRole))
                .employee(testEmployee)
                .build();

        validAuthRequest = new AuthRequest();
        validAuthRequest.setUsername("johndoe");
        validAuthRequest.setPassword("password123");

        validRegisterRequest = new RegisterRequest();
        validRegisterRequest.setUsername("johndoe");
        validRegisterRequest.setPassword("password123");
        validRegisterRequest.setEmail("john.doe@company.com");
        validRegisterRequest.setRoles(Set.of("EMPLOYEE"));
        validRegisterRequest.setEmployeeId(10001L);
        validRegisterRequest.setName("John Doe");
        validRegisterRequest.setDepartment("IT");
        validRegisterRequest.setPosition("Developer");
        validRegisterRequest.setContactInfo("john.doe@company.com");
        validRegisterRequest.setStartDate(LocalDate.now());

        validChangePasswordRequest = new ChangePasswordRequest();
        validChangePasswordRequest.setCurrentPassword("currentPassword");
        validChangePasswordRequest.setNewPassword("newPassword123");
    }

    @Test
    void login_WithValidCredentials_ReturnsAuthResponse() throws Exception {
        // Arrange
        AuthService.AuthResult authResult = new AuthService.AuthResult("jwt-token", testUser);
        when(authService.authenticateAndReturnUser(anyString(), anyString())).thenReturn(authResult);

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validAuthRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.username").value("johndoe"))
                .andExpect(jsonPath("$.role").value("EMPLOYEE"))
                .andExpect(jsonPath("$.employeeId").value("EMP001"))
                .andExpect(jsonPath("$.employeeDbId").value(1));
    }

    @Test
    void login_WithInvalidCredentials_ReturnsUnauthorized() throws Exception {
        // Arrange
        when(authService.authenticateAndReturnUser(anyString(), anyString())).thenReturn(null);

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validAuthRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_WithInvalidRequestBody_ReturnsBadRequest() throws Exception {
        // Arrange
        AuthRequest invalidRequest = new AuthRequest();
        // Missing username and password

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_WithUserWithoutEmployee_ReturnsAuthResponseWithNullEmployeeData() throws Exception {
        // Arrange
        User userWithoutEmployee = User.builder()
                .id(1L)
                .username("johndoe")
                .email("john.doe@company.com")
                .password("hashedPassword")
                .roles(Set.of(testRole))
                .employee(null)
                .build();

        AuthService.AuthResult authResult = new AuthService.AuthResult("jwt-token", userWithoutEmployee);
        when(authService.authenticateAndReturnUser(anyString(), anyString())).thenReturn(authResult);

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validAuthRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.username").value("johndoe"))
                .andExpect(jsonPath("$.role").value("EMPLOYEE"))
                .andExpect(jsonPath("$.employeeId").isEmpty())
                .andExpect(jsonPath("$.employeeDbId").isEmpty());
    }

    @Test
    void register_WithValidRequest_ReturnsAuthResponse() throws Exception {
        // Arrange
        when(authService.registerNewUser(any(RegisterRequest.class))).thenReturn(testUser);

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRegisterRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("johndoe"))
                .andExpect(jsonPath("$.role").value("EMPLOYEE"))
                .andExpect(jsonPath("$.employeeId").value("EMP001"))
                .andExpect(jsonPath("$.employeeDbId").value(1));
    }

    @Test
    void register_WithExistingUsername_ReturnsBadRequest() throws Exception {
        // Arrange
        when(authService.registerNewUser(any(RegisterRequest.class))).thenReturn(null);

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRegisterRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_WithInvalidRequestBody_ReturnsBadRequest() throws Exception {
        // Arrange
        RegisterRequest invalidRequest = new RegisterRequest();
        // Missing required fields

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void forgotPassword_WithValidEmail_ReturnsSuccess() throws Exception {
        // Arrange
        when(authService.initiatePasswordReset(anyString())).thenReturn(true);

        // Act & Assert
        mockMvc.perform(post("/api/auth/forgot-password")
                        .param("email", "john.doe@company.com"))
                .andExpect(status().isOk())
                .andExpect(content().string("Password reset link sent to email if account exists."));
    }

    @Test
    void forgotPassword_WithInvalidEmail_ReturnsBadRequest() throws Exception {
        // Arrange
        when(authService.initiatePasswordReset(anyString())).thenReturn(false);

        // Act & Assert
        mockMvc.perform(post("/api/auth/forgot-password")
                        .param("email", "invalid@email.com"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Email address not found or not valid."));
    }

    @Test
    void resetPassword_WithValidToken_ReturnsSuccess() throws Exception {
        // Arrange
        when(authService.resetPassword(anyString(), anyString())).thenReturn(true);

        // Act & Assert
        mockMvc.perform(post("/api/auth/reset-password")
                        .param("token", "valid-reset-token")
                        .param("newPassword", "newPassword123"))
                .andExpect(status().isOk())
                .andExpect(content().string("Password changed successfully."));
    }

    @Test
    void resetPassword_WithInvalidToken_ReturnsBadRequest() throws Exception {
        // Arrange
        when(authService.resetPassword(anyString(), anyString())).thenReturn(false);

        // Act & Assert
        mockMvc.perform(post("/api/auth/reset-password")
                        .param("token", "invalid-token")
                        .param("newPassword", "newPassword123"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Invalid or expired reset token."));
    }

    @Test
    void changePassword_WithValidRequestAndAuthentication_ReturnsSuccess() throws Exception {
        // Arrange
        when(authService.changePassword(anyString(), anyString(), anyString())).thenReturn(true);

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                "johndoe", "password", List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );

        // Act & Assert
        mockMvc.perform(put("/api/auth/change-password")
                        .with(authentication(authentication))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validChangePasswordRequest)))
                .andExpect(status().isOk())
                .andExpect(content().string("Password changed successfully"));
    }

    @Test
    void changePassword_WithInvalidCurrentPassword_ReturnsBadRequest() throws Exception {
        // Arrange
        when(authService.changePassword(anyString(), anyString(), anyString())).thenReturn(false);

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                "johndoe", "password", List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );

        // Act & Assert
        mockMvc.perform(put("/api/auth/change-password")
                        .with(authentication(authentication))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validChangePasswordRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Current password is incorrect or password change failed"));
    }

    @Test
    void changePassword_WithoutAuthentication_ReturnsUnauthorized() throws Exception {
        // Act & Assert
        mockMvc.perform(put("/api/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validChangePasswordRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void changePassword_WithInvalidRequestBody_ReturnsBadRequest() throws Exception {
        // Arrange
        ChangePasswordRequest invalidRequest = new ChangePasswordRequest();
        // Missing required fields

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                "johndoe", "password", List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );

        // Act & Assert
        mockMvc.perform(put("/api/auth/change-password")
                        .with(authentication(authentication))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }
}
