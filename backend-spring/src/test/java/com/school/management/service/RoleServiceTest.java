package com.school.management.service;

import com.school.management.entity.Role;
import com.school.management.repository.RoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoleServiceTest {

    @Mock
    private RoleRepository roleRepository;

    @InjectMocks
    private RoleService roleService;

    private Role adminRole;
    private Role employeeRole;

    @BeforeEach
    void setUp() {
        adminRole = new Role();
        adminRole.setId(1L);
        adminRole.setName("ADMIN");

        employeeRole = new Role();
        employeeRole.setId(2L);
        employeeRole.setName("EMPLOYEE");
    }

    @Test
    void findByName_WithExistingRoleName_ReturnsRole() {
        // Arrange
        String roleName = "ADMIN";
        when(roleRepository.findByName(roleName)).thenReturn(Optional.of(adminRole));

        // Act
        Optional<Role> result = roleService.findByName(roleName);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(adminRole, result.get());
        assertEquals("ADMIN", result.get().getName());
        verify(roleRepository).findByName(roleName);
    }

    @Test
    void findByName_WithNonexistentRoleName_ReturnsEmpty() {
        // Arrange
        String roleName = "NONEXISTENT";
        when(roleRepository.findByName(roleName)).thenReturn(Optional.empty());

        // Act
        Optional<Role> result = roleService.findByName(roleName);

        // Assert
        assertFalse(result.isPresent());
        verify(roleRepository).findByName(roleName);
    }

    @Test
    void findByName_WithEmployeeRole_ReturnsEmployeeRole() {
        // Arrange
        String roleName = "EMPLOYEE";
        when(roleRepository.findByName(roleName)).thenReturn(Optional.of(employeeRole));

        // Act
        Optional<Role> result = roleService.findByName(roleName);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(employeeRole, result.get());
        assertEquals("EMPLOYEE", result.get().getName());
        verify(roleRepository).findByName(roleName);
    }

    @Test
    void findByName_WithLowercaseRoleName_ReturnsRole() {
        // Arrange
        String roleName = "admin";
        when(roleRepository.findByName(roleName)).thenReturn(Optional.of(adminRole));

        // Act
        Optional<Role> result = roleService.findByName(roleName);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(adminRole, result.get());
        verify(roleRepository).findByName(roleName);
    }

    @Test
    void findByName_WithNullRoleName_ReturnsEmpty() {
        // Arrange
        String roleName = null;
        when(roleRepository.findByName(roleName)).thenReturn(Optional.empty());

        // Act
        Optional<Role> result = roleService.findByName(roleName);

        // Assert
        assertFalse(result.isPresent());
        verify(roleRepository).findByName(roleName);
    }

    @Test
    void findByName_WithEmptyRoleName_ReturnsEmpty() {
        // Arrange
        String roleName = "";
        when(roleRepository.findByName(roleName)).thenReturn(Optional.empty());

        // Act
        Optional<Role> result = roleService.findByName(roleName);

        // Assert
        assertFalse(result.isPresent());
        verify(roleRepository).findByName(roleName);
    }

    @Test
    void save_WithValidRole_ReturnsRole() {
        // Arrange
        when(roleRepository.save(adminRole)).thenReturn(adminRole);

        // Act
        Role result = roleService.save(adminRole);

        // Assert
        assertEquals(adminRole, result);
        verify(roleRepository).save(adminRole);
    }

    @Test
    void save_WithNewRole_ReturnsRoleWithId() {
        // Arrange
        Role newRole = new Role();
        newRole.setName("MANAGER");

        Role savedRole = new Role();
        savedRole.setId(3L);
        savedRole.setName("MANAGER");

        when(roleRepository.save(newRole)).thenReturn(savedRole);

        // Act
        Role result = roleService.save(newRole);

        // Assert
        assertEquals(savedRole, result);
        assertNotNull(result.getId());
        assertEquals("MANAGER", result.getName());
        verify(roleRepository).save(newRole);
    }

    @Test
    void save_WithUpdatedRole_ReturnsUpdatedRole() {
        // Arrange
        adminRole.setName("SUPER_ADMIN");
        when(roleRepository.save(adminRole)).thenReturn(adminRole);

        // Act
        Role result = roleService.save(adminRole);

        // Assert
        assertEquals(adminRole, result);
        assertEquals("SUPER_ADMIN", result.getName());
        verify(roleRepository).save(adminRole);
    }
}
