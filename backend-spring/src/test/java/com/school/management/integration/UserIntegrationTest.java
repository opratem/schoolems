package com.school.management.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.management.entity.Role;
import com.school.management.entity.User;
import com.school.management.payload.ChangePasswordRequest;
import com.school.management.repository.RoleRepository;
import com.school.management.repository.UserRepository;
import com.school.management.security.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.util.Set;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@Transactional
public class UserIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;
    private String adminToken;
    private String userToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        // Clean up
        userRepository.deleteAll();
        roleRepository.deleteAll();

        // Create roles
        Role adminRole = Role.builder().name("ADMIN").build();
        Role employeeRole = Role.builder().name("EMPLOYEE").build();
        roleRepository.save(adminRole);
        roleRepository.save(employeeRole);

        // Create admin user
        User adminUser = User.builder()
                .username("admin")
                .password(passwordEncoder.encode("password"))
                .email("admin@example.com")
                .roles(Set.of(adminRole))
                .build();
        userRepository.save(adminUser);

        // Create regular user
        User regularUser = User.builder()
                .username("user")
                .password(passwordEncoder.encode("password"))
                .email("user@example.com")
                .roles(Set.of(employeeRole))
                .build();
        userRepository.save(regularUser);

        // Generate tokens
        adminToken = jwtUtils.generateToken(adminUser);

        userToken = jwtUtils.generateToken(regularUser);

    }

    @Test
    void testGetAllUsers_AsAdmin_Success() throws Exception {
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].username").exists())
                .andExpect(jsonPath("$[1].username").exists());
    }

    @Test
    void testGetAllUsers_AsUser_Forbidden() throws Exception {
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetUserById_AsAdmin_Success() throws Exception {
        User user = userRepository.findByUsername("user").orElseThrow();

        mockMvc.perform(get("/api/users/" + user.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("user"))
                .andExpect(jsonPath("$.email").value("user@example.com"));
    }

    @Test
    void testGetUserById_AsUser_OwnProfile_Success() throws Exception {
        User user = userRepository.findByUsername("user").orElseThrow();

        mockMvc.perform(get("/api/users/" + user.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("user"));
    }

    @Test
    void testGetUserById_AsUser_OtherProfile_Forbidden() throws Exception {
        User adminUser = userRepository.findByUsername("admin").orElseThrow();

        mockMvc.perform(get("/api/users/" + adminUser.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetUserById_NotFound() throws Exception {
        mockMvc.perform(get("/api/users/999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void testUpdateUser_AsAdmin_Success() throws Exception {
        User user = userRepository.findByUsername("user").orElseThrow();

        User updatedUser = User.builder()
                .username("updateduser")
                .email("updated@example.com")
                .build();

        mockMvc.perform(put("/api/users/" + user.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("updateduser"))
                .andExpect(jsonPath("$.email").value("updated@example.com"));
    }

    @Test
    void testUpdateUser_AsUser_OwnProfile_Success() throws Exception {
        User user = userRepository.findByUsername("user").orElseThrow();

        User updatedUser = User.builder()
                .username("updateduser")
                .email("updated@example.com")
                .build();

        mockMvc.perform(put("/api/users/" + user.getId())
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("updateduser"));
    }

    @Test
    void testDeleteUser_AsAdmin_Success() throws Exception {
        User user = userRepository.findByUsername("user").orElseThrow();

        mockMvc.perform(delete("/api/users/" + user.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        // Verify deletion
        mockMvc.perform(get("/api/users/" + user.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void testDeleteUser_AsUser_Forbidden() throws Exception {
        User adminUser = userRepository.findByUsername("admin").orElseThrow();

        mockMvc.perform(delete("/api/users/" + adminUser.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testChangePassword_Success() throws Exception {
        User user = userRepository.findByUsername("user").orElseThrow();

        ChangePasswordRequest changePasswordRequest = new ChangePasswordRequest();
        changePasswordRequest.setCurrentPassword("password");
        changePasswordRequest.setNewPassword("newpassword123");

        mockMvc.perform(put("/api/users/" + user.getId() + "/change-password")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(changePasswordRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password changed successfully"));
    }

    @Test
    void testChangePassword_WrongCurrentPassword() throws Exception {
        User user = userRepository.findByUsername("user").orElseThrow();

        ChangePasswordRequest changePasswordRequest = new ChangePasswordRequest();
        changePasswordRequest.setCurrentPassword("wrongpassword");
        changePasswordRequest.setNewPassword("newpassword123");

        mockMvc.perform(put("/api/users/" + user.getId() + "/change-password")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(changePasswordRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testChangePassword_AsOtherUser_Forbidden() throws Exception {
        User adminUser = userRepository.findByUsername("admin").orElseThrow();

        ChangePasswordRequest changePasswordRequest = new ChangePasswordRequest();
        changePasswordRequest.setCurrentPassword("password");
        changePasswordRequest.setNewPassword("newpassword123");

        mockMvc.perform(put("/api/users/" + adminUser.getId() + "/change-password")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(changePasswordRequest)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testAccessWithoutToken_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testAccessWithInvalidToken_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer invalid-token"))
                .andExpect(status().isUnauthorized());
    }
}
