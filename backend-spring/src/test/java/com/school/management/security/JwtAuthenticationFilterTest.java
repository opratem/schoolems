package com.school.management.security;

import com.school.management.entity.Role;
import com.school.management.entity.User;
import com.school.management.service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.IOException;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class JwtAuthenticationFilterTest {

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        SecurityContextHolder.clearContext();

        // Create mock user details
        Role role = Role.builder().name("EMPLOYEE").build();
        User user = User.builder()
                .username("testuser")
                .password("password")
                .email("test@example.com")
                .roles(Set.of(role))
                .build();

        userDetails = org.springframework.security.core.userdetails.User.builder()
                .username("testuser")
                .password("password")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE")))
                .build();
    }

    @Test
    void testDoFilterInternal_ValidToken_AuthenticationSet() throws ServletException, IOException {
        // Arrange
        String token = "valid-jwt-token";
        String username = "testuser";

        request.addHeader("Authorization", "Bearer " + token);

        when(jwtUtils.getJwtFromRequest(request)).thenReturn(token);
        when(jwtUtils.validateJwtToken(token)).thenReturn(true);
        when(jwtUtils.getUserNameFromJwtToken(token)).thenReturn(username);
        when(userDetailsService.loadUserByUsername(username)).thenReturn(userDetails);

        // Act
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Assert
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals(username, SecurityContextHolder.getContext().getAuthentication().getName());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void testDoFilterInternal_NoToken_NoAuthentication() throws ServletException, IOException {
        // Arrange
        when(jwtUtils.getJwtFromRequest(request)).thenReturn(null);

        // Act
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Assert
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
        verify(jwtUtils, never()).validateJwtToken(anyString());
        verify(userDetailsService, never()).loadUserByUsername(anyString());
    }

    @Test
    void testDoFilterInternal_InvalidToken_NoAuthentication() throws ServletException, IOException {
        // Arrange
        String token = "invalid-jwt-token";

        request.addHeader("Authorization", "Bearer " + token);

        when(jwtUtils.getJwtFromRequest(request)).thenReturn(token);
        when(jwtUtils.validateJwtToken(token)).thenReturn(false);

        // Act
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Assert
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
        verify(userDetailsService, never()).loadUserByUsername(anyString());
    }

    @Test
    void testDoFilterInternal_ValidTokenButUserNotFound_NoAuthentication() throws ServletException, IOException {
        // Arrange
        String token = "valid-jwt-token";
        String username = "nonexistentuser";

        request.addHeader("Authorization", "Bearer " + token);

        when(jwtUtils.getJwtFromRequest(request)).thenReturn(token);
        when(jwtUtils.validateJwtToken(token)).thenReturn(true);
        when(jwtUtils.getUserNameFromJwtToken(token)).thenReturn(username);
        when(userDetailsService.loadUserByUsername(username))
                .thenThrow(new org.springframework.security.core.userdetails.UsernameNotFoundException("User not found"));

        // Act
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Assert
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void testDoFilterInternal_AlreadyAuthenticated_SkipAuthentication() throws ServletException, IOException {
        // Arrange
        String token = "valid-jwt-token";

        // Set existing authentication
        UsernamePasswordAuthenticationToken existingAuth =
                new UsernamePasswordAuthenticationToken("existinguser", null, List.of());
        SecurityContextHolder.getContext().setAuthentication(existingAuth);

        request.addHeader("Authorization", "Bearer " + token);
        when(jwtUtils.getJwtFromRequest(request)).thenReturn(token);

        // Act
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Assert
        assertEquals("existinguser", SecurityContextHolder.getContext().getAuthentication().getName());
        verify(filterChain).doFilter(request, response);
        verify(jwtUtils, never()).validateJwtToken(anyString());
        verify(userDetailsService, never()).loadUserByUsername(anyString());
    }

    @Test
    void testDoFilterInternal_MalformedAuthorizationHeader_NoAuthentication() throws ServletException, IOException {
        // Arrange
        request.addHeader("Authorization", "Basic sometoken"); // Not Bearer
        when(jwtUtils.getJwtFromRequest(request)).thenReturn(null);

        // Act
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Assert
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void testDoFilterInternal_EmptyAuthorizationHeader_NoAuthentication() throws ServletException, IOException {
        // Arrange
        request.addHeader("Authorization", "");
        when(jwtUtils.getJwtFromRequest(request)).thenReturn(null);

        // Act
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Assert
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void testDoFilterInternal_JwtUtilsThrowsException_NoAuthentication() throws ServletException, IOException {
        // Arrange
        String token = "problematic-token";

        request.addHeader("Authorization", "Bearer " + token);

        when(jwtUtils.getJwtFromRequest(request)).thenReturn(token);
        when(jwtUtils.validateJwtToken(token)).thenThrow(new RuntimeException("JWT processing error"));

        // Act
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Assert
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void testDoFilterInternal_ValidTokenWithAuthorities_CorrectAuthoritiesSet() throws ServletException, IOException {
        // Arrange
        String token = "valid-jwt-token";
        String username = "adminuser";

        UserDetails adminUserDetails = org.springframework.security.core.userdetails.User.builder()
                .username("adminuser")
                .password("password")
                .authorities(List.of(
                        new SimpleGrantedAuthority("ROLE_ADMIN"),
                        new SimpleGrantedAuthority("ROLE_EMPLOYEE")
                ))
                .build();

        request.addHeader("Authorization", "Bearer " + token);

        when(jwtUtils.getJwtFromRequest(request)).thenReturn(token);
        when(jwtUtils.validateJwtToken(token)).thenReturn(true);
        when(jwtUtils.getUserNameFromJwtToken(token)).thenReturn(username);
        when(userDetailsService.loadUserByUsername(username)).thenReturn(adminUserDetails);

        // Act
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Assert
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals(username, SecurityContextHolder.getContext().getAuthentication().getName());
        assertEquals(2, SecurityContextHolder.getContext().getAuthentication().getAuthorities().size());
        assertTrue(SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN")));
        verify(filterChain).doFilter(request, response);
    }
}
