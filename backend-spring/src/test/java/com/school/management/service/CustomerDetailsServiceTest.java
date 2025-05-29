package com.school.management.service;

import com.school.management.entity.Role;
import com.school.management.entity.User;
import com.school.management.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    private User testUser;
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

        Set<Role> roles = new HashSet<>();
        roles.add(adminRole);
        roles.add(employeeRole);

        testUser = User.builder()
                .id(1L)
                .username("johndoe")
                .email("john.doe@company.com")
                .password("hashedPassword")
                .roles(roles)
                .build();
    }

    @Test
    void loadUserByUsername_WithExistingUser_ReturnsUserDetails() {
        // Arrange
        String username = "johndoe";
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));

        // Act
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);

        // Assert
        assertNotNull(userDetails);
        assertEquals("johndoe", userDetails.getUsername());
        assertEquals("hashedPassword", userDetails.getPassword());
        assertEquals(2, userDetails.getAuthorities().size());

        assertTrue(userDetails.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN")));
        assertTrue(userDetails.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_EMPLOYEE")));

        verify(userRepository).findByUsername(username);
    }

    @Test
    void loadUserByUsername_WithUserWithSingleRole_ReturnsUserDetailsWithSingleAuthority() {
        // Arrange
        String username = "johndoe";
        Set<Role> singleRole = new HashSet<>();
        singleRole.add(employeeRole);
        testUser.setRoles(singleRole);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));

        // Act
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);

        // Assert
        assertNotNull(userDetails);
        assertEquals("johndoe", userDetails.getUsername());
        assertEquals("hashedPassword", userDetails.getPassword());
        assertEquals(1, userDetails.getAuthorities().size());

        assertTrue(userDetails.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_EMPLOYEE")));
        assertFalse(userDetails.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN")));

        verify(userRepository).findByUsername(username);
    }

    @Test
    void loadUserByUsername_WithUserWithNoRoles_ReturnsUserDetailsWithNoAuthorities() {
        // Arrange
        String username = "johndoe";
        testUser.setRoles(new HashSet<>());

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));

        // Act
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);

        // Assert
        assertNotNull(userDetails);
        assertEquals("johndoe", userDetails.getUsername());
        assertEquals("hashedPassword", userDetails.getPassword());
        assertEquals(0, userDetails.getAuthorities().size());

        verify(userRepository).findByUsername(username);
    }

    @Test
    void loadUserByUsername_WithNonexistentUser_ThrowsUsernameNotFoundException() {
        // Arrange
        String username = "nonexistent";
        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        // Act & Assert
        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> customUserDetailsService.loadUserByUsername(username)
        );

        assertEquals("User not found: nonexistent", exception.getMessage());
        verify(userRepository).findByUsername(username);
    }

    @Test
    void loadUserByUsername_WithNullUsername_ThrowsUsernameNotFoundException() {
        // Arrange
        String username = null;
        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        // Act & Assert
        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> customUserDetailsService.loadUserByUsername(username)
        );

        assertEquals("User not found: null", exception.getMessage());
        verify(userRepository).findByUsername(username);
    }

    @Test
    void loadUserByUsername_WithEmptyUsername_ThrowsUsernameNotFoundException() {
        // Arrange
        String username = "";
        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        // Act & Assert
        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> customUserDetailsService.loadUserByUsername(username)
        );

        assertEquals("User not found: ", exception.getMessage());
        verify(userRepository).findByUsername(username);
    }

    @Test
    void loadUserByUsername_VerifyUserDetailsImplementsCorrectInterface() {
        // Arrange
        String username = "johndoe";
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));

        // Act
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);

        // Assert
        assertTrue(userDetails.isAccountNonExpired());
        assertTrue(userDetails.isAccountNonLocked());
        assertTrue(userDetails.isCredentialsNonExpired());
        assertTrue(userDetails.isEnabled());
    }

    @Test
    void loadUserByUsername_WithCustomRoleNames_MapsCorrectly() {
        // Arrange
        String username = "johndoe";

        Role customRole = new Role();
        customRole.setId(3L);
        customRole.setName("CUSTOM_ROLE");

        Set<Role> customRoles = new HashSet<>();
        customRoles.add(customRole);
        testUser.setRoles(customRoles);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));

        // Act
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);

        // Assert
        assertNotNull(userDetails);
        assertEquals(1, userDetails.getAuthorities().size());
        assertTrue(userDetails.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_CUSTOM_ROLE")));

        verify(userRepository).findByUsername(username);
    }

    @Test
    void loadUserByUsername_WithRoleNameContainingSpaces_MapsCorrectly() {
        // Arrange
        String username = "johndoe";

        Role roleWithSpaces = new Role();
        roleWithSpaces.setId(4L);
        roleWithSpaces.setName("SUPER ADMIN");

        Set<Role> rolesWithSpaces = new HashSet<>();
        rolesWithSpaces.add(roleWithSpaces);
        testUser.setRoles(rolesWithSpaces);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));

        // Act
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);

        // Assert
        assertNotNull(userDetails);
        assertEquals(1, userDetails.getAuthorities().size());
        assertTrue(userDetails.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_SUPER ADMIN")));

        verify(userRepository).findByUsername(username);
    }
}