package com.school.management.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.management.entity.Employee;
import com.school.management.service.EmployeeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EmployeeController.class)
class EmployeeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EmployeeService employeeService;

    @Autowired
    private ObjectMapper objectMapper;

    private Employee testEmployee1;
    private Employee testEmployee2;
    private List<Employee> employeeList;

    @BeforeEach
    void setUp() {
        testEmployee1 = Employee.builder()
                .id(1L)
                .employeeId("EMP001")
                .name("John Doe")
                .department("IT")
                .position("Developer")
                .contactInfo("john.doe@company.com")
                .startDate(LocalDate.now())
                .build();

        testEmployee2 = Employee.builder()
                .id(2L)
                .employeeId("EMP002")
                .name("Jane Smith")
                .department("HR")
                .position("Manager")
                .contactInfo("jane.smith@company.com")
                .startDate(LocalDate.now().minusYears(1))
                .build();

        employeeList = Arrays.asList(testEmployee1, testEmployee2);
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void getAllEmployees_WithAdminRole_ReturnsEmployeeList() throws Exception {
        // Arrange
        when(employeeService.findAll()).thenReturn(employeeList);

        // Act & Assert
        mockMvc.perform(get("/api/employees"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].employeeId").value("EMP001"))
                .andExpect(jsonPath("$[0].name").value("John Doe"))
                .andExpect(jsonPath("$[1].employeeId").value("EMP002"))
                .andExpect(jsonPath("$[1].name").value("Jane Smith"));
    }

    @Test
    @WithMockUser(roles = {"EMPLOYEE"})
    void getAllEmployees_WithEmployeeRole_ReturnsEmployeeList() throws Exception {
        // Arrange
        when(employeeService.findAll()).thenReturn(employeeList);

        // Act & Assert
        mockMvc.perform(get("/api/employees"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @WithMockUser(roles = {"MANAGER"})
    void getAllEmployees_WithManagerRole_ReturnsEmployeeList() throws Exception {
        // Arrange
        when(employeeService.findAll()).thenReturn(employeeList);

        // Act & Assert
        mockMvc.perform(get("/api/employees"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void getAllEmployees_WithoutAuthentication_ReturnsUnauthorized() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/employees"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = {"USER"})
    void getAllEmployees_WithInvalidRole_ReturnsForbidden() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/employees"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void getEmployeeById_WithExistingEmployee_ReturnsEmployee() throws Exception {
        // Arrange
        when(employeeService.findById(1L)).thenReturn(Optional.of(testEmployee1));

        // Act & Assert
        mockMvc.perform(get("/api/employees/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.employeeId").value("EMP001"))
                .andExpect(jsonPath("$.name").value("John Doe"))
                .andExpect(jsonPath("$.department").value("IT"))
                .andExpect(jsonPath("$.position").value("Developer"));
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void getEmployeeById_WithNonexistentEmployee_ReturnsNotFound() throws Exception {
        // Arrange
        when(employeeService.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/employees/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"EMPLOYEE"})
    void getEmployeeById_WithEmployeeRole_ReturnsEmployee() throws Exception {
        // Arrange
        when(employeeService.findById(1L)).thenReturn(Optional.of(testEmployee1));

        // Act & Assert
        mockMvc.perform(get("/api/employees/1"))
                .andExpect(status().isOk());
    }

    @Test
    void getEmployeeById_WithoutAuthentication_ReturnsUnauthorized() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/employees/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void createEmployee_WithValidData_ReturnsCreatedEmployee() throws Exception {
        // Arrange
        Employee newEmployee = Employee.builder()
                .employeeId("EMP003")
                .name("Bob Wilson")
                .department("Finance")
                .position("Analyst")
                .contactInfo("bob.wilson@company.com")
                .startDate(LocalDate.now())
                .build();

        Employee savedEmployee = Employee.builder()
                .id(3L)
                .employeeId("EMP003")
                .name("Bob Wilson")
                .department("Finance")
                .position("Analyst")
                .contactInfo("bob.wilson@company.com")
                .startDate(LocalDate.now())
                .build();

        when(employeeService.save(any(Employee.class))).thenReturn(savedEmployee);

        // Act & Assert
        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newEmployee)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.employeeId").value("EMP003"))
                .andExpect(jsonPath("$.name").value("Bob Wilson"));
    }

    @Test
    @WithMockUser(roles = {"MANAGER"})
    void createEmployee_WithManagerRole_ReturnsCreatedEmployee() throws Exception {
        // Arrange
        Employee newEmployee = Employee.builder()
                .employeeId("EMP003")
                .name("Bob Wilson")
                .department("Finance")
                .position("Analyst")
                .contactInfo("bob.wilson@company.com")
                .startDate(LocalDate.now())
                .build();

        when(employeeService.save(any(Employee.class))).thenReturn(newEmployee);

        // Act & Assert
        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newEmployee)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = {"EMPLOYEE"})
    void createEmployee_WithEmployeeRole_ReturnsForbidden() throws Exception {
        // Arrange
        Employee newEmployee = Employee.builder()
                .employeeId("EMP003")
                .name("Bob Wilson")
                .build();

        // Act & Assert
        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newEmployee)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void createEmployee_WithInvalidData_ReturnsBadRequest() throws Exception {
        // Arrange
        Employee invalidEmployee = new Employee(); // Missing required fields

        // Act & Assert
        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidEmployee)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createEmployee_WithoutAuthentication_ReturnsUnauthorized() throws Exception {
        // Arrange
        Employee newEmployee = Employee.builder()
                .employeeId("EMP003")
                .name("Bob Wilson")
                .build();

        // Act & Assert
        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newEmployee)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void updateEmployee_WithExistingEmployee_ReturnsUpdatedEmployee() throws Exception {
        // Arrange
        Employee updatedEmployee = Employee.builder()
                .employeeId("EMP001")
                .name("John Doe Updated")
                .department("IT")
                .position("Senior Developer")
                .contactInfo("john.doe.updated@company.com")
                .startDate(LocalDate.now())
                .build();

        Employee savedEmployee = Employee.builder()
                .id(1L)
                .employeeId("EMP001")
                .name("John Doe Updated")
                .department("IT")
                .position("Senior Developer")
                .contactInfo("john.doe.updated@company.com")
                .startDate(LocalDate.now())
                .build();

        when(employeeService.findById(1L)).thenReturn(Optional.of(testEmployee1));
        when(employeeService.save(any(Employee.class))).thenReturn(savedEmployee);

        // Act & Assert
        mockMvc.perform(put("/api/employees/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedEmployee)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("John Doe Updated"))
                .andExpect(jsonPath("$.position").value("Senior Developer"));
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void updateEmployee_WithNonexistentEmployee_ReturnsNotFound() throws Exception {
        // Arrange
        Employee updatedEmployee = Employee.builder()
                .employeeId("EMP999")
                .name("Nonexistent Employee")
                .build();

        when(employeeService.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(put("/api/employees/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedEmployee)))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"MANAGER"})
    void updateEmployee_WithManagerRole_ReturnsUpdatedEmployee() throws Exception {
        // Arrange
        Employee updatedEmployee = Employee.builder()
                .employeeId("EMP001")
                .name("John Doe Updated")
                .build();

        when(employeeService.findById(1L)).thenReturn(Optional.of(testEmployee1));
        when(employeeService.save(any(Employee.class))).thenReturn(testEmployee1);

        // Act & Assert
        mockMvc.perform(put("/api/employees/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedEmployee)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = {"EMPLOYEE"})
    void updateEmployee_WithEmployeeRole_ReturnsForbidden() throws Exception {
        // Arrange
        Employee updatedEmployee = Employee.builder()
                .employeeId("EMP001")
                .name("John Doe Updated")
                .build();

        // Act & Assert
        mockMvc.perform(put("/api/employees/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedEmployee)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void deleteEmployee_WithExistingEmployee_ReturnsNoContent() throws Exception {
        // Arrange
        when(employeeService.findById(1L)).thenReturn(Optional.of(testEmployee1));
        doNothing().when(employeeService).deleteById(1L);

        // Act & Assert
        mockMvc.perform(delete("/api/employees/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void deleteEmployee_WithNonexistentEmployee_ReturnsNotFound() throws Exception {
        // Arrange
        when(employeeService.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(delete("/api/employees/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"MANAGER"})
    void deleteEmployee_WithManagerRole_ReturnsForbidden() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/employees/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = {"EMPLOYEE"})
    void deleteEmployee_WithEmployeeRole_ReturnsForbidden() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/employees/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteEmployee_WithoutAuthentication_ReturnsUnauthorized() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/employees/1"))
                .andExpect(status().isUnauthorized());
    }
}
