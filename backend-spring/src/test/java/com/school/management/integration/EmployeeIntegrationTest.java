package com.school.management.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.management.entity.Employee;
import com.school.management.entity.Role;
import com.school.management.entity.User;
import com.school.management.repository.EmployeeRepository;
import com.school.management.repository.RoleRepository;
import com.school.management.repository.UserRepository;
import com.school.management.security.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
@Transactional
class EmployeeIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    private String adminToken;
    private String employeeToken;
    private Employee testEmployee;
    private Role adminRole;
    private Role employeeRole;

    @BeforeEach
    void setUp() {
        // Clean up existing data
        userRepository.deleteAll();
        employeeRepository.deleteAll();
        roleRepository.deleteAll();

        // Create roles
        adminRole = Role.builder().name("ADMIN").build();
        employeeRole = Role.builder().name("EMPLOYEE").build();
        roleRepository.save(adminRole);
        roleRepository.save(employeeRole);

        // Create test employee
        testEmployee = Employee.builder()
                .employeeId("EMP001")
                .name("John Doe")
                .email("john.doe@school.com")
                .contactInfo("1234567890")
                .department("IT")
                .position("Developer")
                .startDate(LocalDate.of(2023, 1, 15))
                .build();
        employeeRepository.save(testEmployee);

        // Create admin user
        User adminUser = User.builder()
                .username("admin")
                .password(passwordEncoder.encode("admin123"))
                .email("admin@school.com")
                .roles(Set.of(adminRole))
                .build();
        userRepository.save(adminUser);
        adminToken = jwtUtils.generateToken(adminUser);

        // Create employee user
        User empUser = User.builder()
                .username("employee")
                .password(passwordEncoder.encode("emp123"))
                .email("emp@school.com")
                .employee(testEmployee)
                .roles(Set.of(employeeRole))
                .build();
        userRepository.save(empUser);
        employeeToken = jwtUtils.generateToken(empUser);
    }

    @Test
    void getAllEmployees_WithAdminAuth_ShouldReturnAllEmployees() throws Exception {
        // Given - Additional employee
        Employee secondEmployee = Employee.builder()
                .employeeId("EMP002")
                .name("Jane Smith")
                .email("jane.smith@school.com")
                .department("HR")
                .position("Manager")
                .build();
        employeeRepository.save(secondEmployee);

        // When & Then
        mockMvc.perform(get("/api/employees")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].employeeId", containsInAnyOrder("EMP001", "EMP002")))
                .andExpect(jsonPath("$[*].firstName", containsInAnyOrder("John", "Jane")));
    }

    @Test
    void getAllEmployees_WithoutAuth_ShouldReturnUnauthorized() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/employees"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getEmployeeById_WithValidId_ShouldReturnEmployee() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/employees/{id}", testEmployee.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.employeeId", is("EMP001")))
                .andExpect(jsonPath("$.firstName", is("John")))
                .andExpect(jsonPath("$.lastName", is("Doe")))
                .andExpect(jsonPath("$.email", is("john.doe@school.com")))
                .andExpect(jsonPath("$.department", is("IT")))
                .andExpect(jsonPath("$.position", is("Developer")));
    }

    @Test
    void getEmployeeById_WithInvalidId_ShouldReturnNotFound() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/employees/{id}", 99999L)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void createEmployee_WithValidData_ShouldCreateEmployee() throws Exception {
        // Given
        Employee newEmployee = Employee.builder()
                .employeeId("EMP003")
                .name("Allison Johnson")
                .email("alice.johnson@school.com")
                .contactInfo("5555555555")
                .department("Finance")
                .position("Analyst")
                .startDate(LocalDate.of(2024, 1, 1))
                .build();

        // When & Then
        mockMvc.perform(post("/api/employees")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newEmployee)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.employeeId", is("EMP003")))
                .andExpect(jsonPath("$.firstName", is("Alice")))
                .andExpect(jsonPath("$.lastName", is("Johnson")))
                .andExpect(jsonPath("$.email", is("alice.johnson@school.com")))
                .andExpect(jsonPath("$.department", is("Finance")))
                .andExpect(jsonPath("$.position", is("Analyst")))
                .andExpect(jsonPath("$.salary", is(60000.0)));

        // Verify employee was created in database
        assert employeeRepository.findByEmployeeId("EMP003").isPresent();
    }

    @Test
    void createEmployee_WithDuplicateEmployeeId_ShouldReturnBadRequest() throws Exception {
        // Given
        Employee duplicateEmployee = Employee.builder()
                .employeeId("EMP001") // Same as existing
                .name("Different Person")
                .email("different@school.com")
                .department("Different")
                .position("Different")
                .build();

        // When & Then
        mockMvc.perform(post("/api/employees")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateEmployee)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createEmployee_WithInvalidData_ShouldReturnBadRequest() throws Exception {
        // Given - Employee with missing required fields
        Employee invalidEmployee = Employee.builder()
                .name("") // Empty name
                .build();

        // When & Then
        mockMvc.perform(post("/api/employees")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidEmployee)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateEmployee_WithValidData_ShouldUpdateEmployee() throws Exception {
        // Given
        Employee updatedEmployee = Employee.builder()
                .id(testEmployee.getId())
                .employeeId("EMP001")
                .name("John Doe")
                .email("john.doe.updated@school.com") // Updated email
                .contactInfo("9999999999") // Updated phone
                .department("Engineering") // Updated department
                .position("Senior Developer") // Updated position
                .startDate(LocalDate.of(2023, 1, 15))
                .build();

        // When & Then
        mockMvc.perform(put("/api/employees/{id}", testEmployee.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedEmployee)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.email", is("john.doe.updated@school.com")))
                .andExpect(jsonPath("$.phone", is("9999999999")))
                .andExpect(jsonPath("$.department", is("Engineering")))
                .andExpect(jsonPath("$.position", is("Senior Developer")))
                .andExpect(jsonPath("$.salary", is(85000.0)));

        // Verify employee was updated in database
        Employee dbEmployee = employeeRepository.findById(testEmployee.getId()).orElse(null);
        assert dbEmployee != null;
        assert dbEmployee.getEmail().equals("john.doe.updated@school.com");
        assert dbEmployee.getDepartment().equals("Engineering");
    }

    @Test
    void updateEmployee_WithInvalidId_ShouldReturnNotFound() throws Exception {
        // Given
        Employee updateData = Employee.builder()
                .employeeId("EMP999")
                .name("Test User")
                .email("test@school.com")
                .department("Test")
                .position("Tester")
                .build();

        // When & Then
        mockMvc.perform(put("/api/employees/{id}", 99999L)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateData)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteEmployee_WithValidId_ShouldDeleteEmployee() throws Exception {
        // When & Then
        mockMvc.perform(delete("/api/employees/{id}", testEmployee.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        // Verify employee was deleted from database
        assert employeeRepository.findById(testEmployee.getId()).isEmpty();
    }

    @Test
    void deleteEmployee_WithInvalidId_ShouldReturnNotFound() throws Exception {
        // When & Then
        mockMvc.perform(delete("/api/employees/{id}", 99999L)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void employeeOperations_WithEmployeeRole_ShouldHaveLimitedAccess() throws Exception {
        // Employee users should have limited access to employee operations

        // Should be able to view employees (depends on your business logic)
        mockMvc.perform(get("/api/employees")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk());

        // Should NOT be able to create employees
        Employee newEmployee = Employee.builder()
                .employeeId("EMP999")
                .name("Test User")
                .email("test@school.com")
                .department("Test")
                .position("Tester")
                .build();

        mockMvc.perform(post("/api/employees")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newEmployee)))
                .andExpect(status().isForbidden());

        // Should NOT be able to delete employees
        mockMvc.perform(delete("/api/employees/{id}", testEmployee.getId())
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void searchEmployeeByEmployeeId_ShouldWork() throws Exception {
        // This test assumes there's a search endpoint
        // When & Then
        mockMvc.perform(get("/api/employees/search")
                        .param("employeeId", "EMP001")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.employeeId", is("EMP001")))
                .andExpect(jsonPath("$.firstName", is("John")));
    }

    @Test
    void employeeCrudFlow_CompleteWorkflow_ShouldWork() throws Exception {
        // Step 1: Create employee
        Employee newEmployee = Employee.builder()
                .employeeId("EMP_FLOW")
                .name("Flow Test/")
                .email("flow@school.com")
                .department("Testing")
                .position("Tester")
                .build();

        String response = mockMvc.perform(post("/api/employees")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newEmployee)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Employee createdEmployee = objectMapper.readValue(response, Employee.class);
        Long employeeId = createdEmployee.getId();

        // Step 2: Read employee
        mockMvc.perform(get("/api/employees/{id}", employeeId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.employeeId", is("EMP_FLOW")));

        // Step 3: Update employee
        createdEmployee.setDepartment("Updated Testing");
        mockMvc.perform(put("/api/employees/{id}", employeeId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createdEmployee)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.department", is("Updated Testing")));

        // Step 4: Delete employee
        mockMvc.perform(delete("/api/employees/{id}", employeeId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        // Step 5: Verify deletion
        mockMvc.perform(get("/api/employees/{id}", employeeId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }
}
