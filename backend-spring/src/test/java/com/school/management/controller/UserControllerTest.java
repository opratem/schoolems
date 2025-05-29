package com.school.management.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.management.entity.Role;
import com.school.management.entity.User;
import com.school.management.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private Role testRole;

    @BeforeEach
    void setUp() {
        testRole = new Role();
        testRole.setId(1L);
        testRole.setName("EMPLOYEE");

        testUser = User.builder()
                .id(1L)
                .username("johndoe")
                .email("john.doe@company.com")
                .password("hashedPassword")
                .roles(Set.of(testRole))
                .build();
    }

    @Test
    void getCurrentUserProfile_WithValidAuthentication_ReturnsUserProfile() throws Exception {
        // Arrange
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                "johndoe", "password", List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"))
        );
        when(userService.getUserByUsername("johndoe")).thenReturn(testUser);

        // Act & Assert
        mockMvc.perform(get("/api/users/profile")
                        .with(authentication(authentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.username").value("johndoe"))
                .andExpect(jsonPath("$.email").value("john.doe@company.com"));
    }

    @Test
    void getCurrentUserProfile_WithNonexistentUser_ReturnsNotFound() throws Exception {
        // Arrange
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                "nonexistent", "password", List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"))
        );
        when(userService.getUserByUsername("nonexistent")).thenReturn(null);

        // Act & Assert
        mockMvc.perform(get("/api/users/profile")
                        .with(authentication(authentication)))
                .andExpect(status().isNotFound());
    }

    @Test
    void getCurrentUserProfile_WithoutAuthentication_ReturnsUnauthorized() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/users/profile"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("User not authenticated"));
    }

    @Test
    void getCurrentUserProfile_WithUnauthenticatedUser_ReturnsUnauthorized() throws Exception {
        // Arrange
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                "johndoe", "password", List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"))
        );
        authentication.setAuthenticated(false);

        // Act & Assert
        mockMvc.perform(get("/api/users/profile")
                        .with(authentication(authentication)))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("User not authenticated"));
    }

    @Test
    void updateUserProfile_WithValidUpdates_ReturnsUpdatedUser() throws Exception {
        // Arrange
        Map<String, String> updates = new HashMap<>();
        updates.put("email", "newemail@company.com");

        User updatedUser = User.builder()
                .id(1L)
                .username("johndoe")
                .email("newemail@company.com")
                .password("hashedPassword")
                .roles(Set.of(testRole))
                .build();

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                "johndoe", "password", List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"))
        );

        when(userService.updateUserProfile(anyString(), any(Map.class))).thenReturn(updatedUser);

        // Act & Assert
        mockMvc.perform(put("/api/users/profile")
                        .with(authentication(authentication))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.username").value("johndoe"))
                .andExpect(jsonPath("$.email").value("newemail@company.com"));
    }

    @Test
    void updateUserProfile_WithEmptyUpdates_ReturnsUpdatedUser() throws Exception {
        // Arrange
        Map<String, String> updates = new HashMap<>();

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                "johndoe", "password", List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"))
        );

        when(userService.updateUserProfile(anyString(), any(Map.class))).thenReturn(testUser);

        // Act & Assert
        mockMvc.perform(put("/api/users/profile")
                        .with(authentication(authentication))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("johndoe"));
    }

    @Test
    void updateUserProfile_WithFailedUpdate_ReturnsBadRequest() throws Exception {
        // Arrange
        Map<String, String> updates = new HashMap<>();
        updates.put("email", "invalid-email");

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                "johndoe", "password", List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"))
        );

        when(userService.updateUserProfile(anyString(), any(Map.class))).thenReturn(null);

        // Act & Assert
        mockMvc.perform(put("/api/users/profile")
                        .with(authentication(authentication))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Failed to update profile"));
    }

    @Test
    void updateUserProfile_WithoutAuthentication_ReturnsUnauthorized() throws Exception {
        // Arrange
        Map<String, String> updates = new HashMap<>();
        updates.put("email", "newemail@company.com");

        // Act & Assert
        mockMvc.perform(put("/api/users/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("User not authenticated"));
    }

    @Test
    void updateUserProfile_WithUnauthenticatedUser_ReturnsUnauthorized() throws Exception {
        // Arrange
        Map<String, String> updates = new HashMap<>();
        updates.put("email", "newemail@company.com");

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                "johndoe", "password", List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"))
        );
        authentication.setAuthenticated(false);

        // Act & Assert
        mockMvc.perform(put("/api/users/profile")
                        .with(authentication(authentication))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("User not authenticated"));
    }

    @Test
    void updateUserProfile_WithMultipleUpdates_ReturnsUpdatedUser() throws Exception {
        // Arrange
        Map<String, String> updates = new HashMap<>();
        updates.put("email", "newemail@company.com");
        updates.put("someOtherField", "someValue");

        User updatedUser = User.builder()
                .id(1L)
                .username("johndoe")
                .email("newemail@company.com")
                .password("hashedPassword")
                .roles(Set.of(testRole))
                .build();

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                "johndoe", "password", List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"))
        );

        when(userService.updateUserProfile(anyString(), any(Map.class))).thenReturn(updatedUser);

        // Act & Assert
        mockMvc.perform(put("/api/users/profile")
                        .with(authentication(authentication))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("newemail@company.com"));
    }

    @Test
    void updateUserProfile_WithNullUpdates_ReturnsBadRequest() throws Exception {
        // Arrange
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                "johndoe", "password", List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"))
        );

        // Act & Assert
        mockMvc.perform(put("/api/users/profile")
                        .with(authentication(authentication))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("null"))
                .andExpect(status().isBadRequest());
    }
}
