package com.schoolems.schoolems.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.schoolems.schoolems.dto.AuthRequest;
import com.schoolems.schoolems.dto.UserRegistrationDto;
import com.schoolems.schoolems.entity.User;
import com.schoolems.schoolems.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    public void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void testRegistrationAndLoginFlow() throws Exception {
        UserRegistrationDto dto = new UserRegistrationDto("John Doe", "john@example.com", "password123", "IT", "EMPLOYEE");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());

        AuthRequest loginRequest = new AuthRequest("John Doe", "john@example.com", "password123", "EMPLOYEE");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());
    }

    @Test
    void testLoginWithInvalidCredentials() throws Exception {
        User user = new User();
        user.setName("Existing User");
        user.setEmail("existing@test.com");
        user.setPassword(passwordEncoder.encode("correctPassword"));
        user.setRole("EMPLOYEE");
        userRepository.save(user);

        String invalidLoginJson = """
        {
            "email": "existing@test.com",
            "password": "wrongPassword"
        }
        """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidLoginJson))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testRegistrationWithExistingEmail() throws Exception {
        User existingUser = new User();
        existingUser.setEmail("exists@test.com");
        existingUser.setPassword(passwordEncoder.encode("securePass123"));
        userRepository.save(existingUser);

        UserRegistrationDto duplicateDto = new UserRegistrationDto();
        duplicateDto.setEmail("exists@test.com");
        duplicateDto.setPassword("newPassword");
        duplicateDto.setRole("EMPLOYEE");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateDto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void whenRegisterWithInvalidData_thenBadRequest() throws Exception {
        UserRegistrationDto invalidDto = new UserRegistrationDto(); // missing fields

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidDto)))
                .andExpect(status().isBadRequest());
    }
}
