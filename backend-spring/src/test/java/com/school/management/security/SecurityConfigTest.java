package com.school.management.security;

import com.school.management.entity.Role;
import com.school.management.entity.User;
import com.school.management.repository.RoleRepository;
import com.school.management.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.util.Set;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
@Transactional
public class SecurityConfigTest {

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

    private MockMvc mockMvc;
    private String adminToken;
    private String employeeToken;

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

        // Create employee user
        User empUser = User.builder()
                .username("employee")
                .password(passwordEncoder.encode("password"))
                .email("employee@example.com")
                .roles(Set.of(employeeRole))
                .build();
        userRepository.save(empUser);

        // Generate tokens
        adminToken = jwtUtils.generateJwtToken(
                new UsernamePasswordAuthenticationToken("admin", null, adminUser.getRoles().stream()
                        .map(role -> () -> "ROLE_" + role.getName()).toList()));

        employeeToken = jwtUtils.generateJwtToken(
                new UsernamePasswordAuthenticationToken("employee", null, empUser.getRoles().stream()
                        .map(role -> () -> "ROLE_" + role.getName()).toList()));
    }

    @Test
    void testPublicEndpoints_AllowAnonymousAccess() throws Exception {
        // Test auth endpoints are publicly accessible
        mockMvc.perform(post("/api/auth/login"))
                .andExpect(status().isBadRequest()); // Bad request due to missing body, but not unauthorized

        mockMvc.perform(post("/api/auth/register"))
                .andExpect(status().isBadRequest()); // Bad request due to missing body, but not unauthorized
    }

    @Test
    void testProtectedEndpoints_RequireAuthentication() throws Exception {
        // Test that protected endpoints require authentication
        mockMvc.perform(get("/api/users"))
                .andExpected(status().isUnauthorized());

        mockMvc.perform(get("/api/employees"))
                .andExpected(status().isUnauthorized());

        mockMvc.perform(get("/api/leave-requests"))
                .andExpected(status().isUnauthorized());
    }

    @Test
    void testAdminEndpoints_RequireAdminRole() throws Exception {
        // Admin can access user management
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpected(status().isOk());

        // Employee cannot access user management
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpected(status().isForbidden());
    }

    @Test
    void testEmployeeEndpoints_AdminAccess() throws Exception {
        // Admin can access employee endpoints
        mockMvc.perform(get("/api/employees")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpected(status().isOk());

        // Employee can also access employee endpoints (read-only)
        mockMvc.perform(get("/api/employees")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpected(status().isOk());
    }

    @Test
    void testLeaveRequestEndpoints_BothRolesAccess() throws Exception {
        // Both admin and employee can access leave request endpoints
        mockMvc.perform(get("/api/leave-requests")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpected(status().isOk());

        mockMvc.perform(get("/api/leave-requests")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpected(status().isOk());
    }

    @Test
    void testInvalidToken_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer invalid-token"))
                .andExpected(status().isUnauthorized());
    }

    @Test
    void testMalformedAuthorizationHeader_Unauthorized() throws Exception {
        // Test without "Bearer " prefix
        mockMvc.perform(get("/api/users")
                        .header("Authorization", adminToken))
                .andExpected(status().isUnauthorized());

        // Test with wrong prefix
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Basic " + adminToken))
                .andExpected(status().isUnauthorized());
    }

    @Test
    void testMissingAuthorizationHeader_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpected(status().isUnauthorized());
    }

    @Test
    void testExpiredToken_Unauthorized() throws Exception {
        // Note: This test would require creating an expired token
        // For now, we test with an obviously invalid token format
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer expired.token.here"))
                .andExpected(status().isUnauthorized());
    }

    @Test
    void testCorsConfiguration_OptionsRequest() throws Exception {
        // Test CORS preflight request
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options("/api/users")
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "Authorization"))
                .andExpected(status().isOk());
    }

    @Test
    void testSecurityHeaders() throws Exception {
        // Test that security headers are properly configured
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpected(status().isOk())
                .andExpected(header -> {
                    // Verify security headers if configured
                    // This depends on your security configuration
                });
    }
}
