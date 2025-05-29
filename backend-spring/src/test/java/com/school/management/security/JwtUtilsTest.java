package com.school.management.security;

import com.school.management.entity.Role;
import com.school.management.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.security.Key;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class JwtUtilsTest {

    private JwtUtils jwtUtils;
    private User testUser;
    private final String jwtSecret = "ThisIsASecretKeyForJwtTokenShouldBeLongEnoughToBeSecure";

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();

        Role adminRole = new Role();
        adminRole.setId(1L);
        adminRole.setName("ADMIN");

        Role employeeRole = new Role();
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
    void generateToken_WithValidUser_ReturnsToken() {
        // Act
        String token = jwtUtils.generateToken(testUser);

        // Assert
        assertNotNull(token);
        assertFalse(token.isEmpty());
        assertTrue(token.split("\\.").length == 3); // JWT should have 3 parts separated by dots
    }

    @Test
    void generateToken_WithUserWithRoles_IncludesRolesInToken() {
        // Act
        String token = jwtUtils.generateToken(testUser);

        // Assert
        assertNotNull(token);

        // Decode the token to verify roles are included
        Key signingKey = getSignInKey();
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();

        String roles = claims.get("roles", String.class);
        assertNotNull(roles);
        assertTrue(roles.contains("ADMIN"));
        assertTrue(roles.contains("EMPLOYEE"));
    }

    @Test
    void generateToken_WithUserWithSingleRole_IncludesSingleRoleInToken() {
        // Arrange
        Role singleRole = new Role();
        singleRole.setId(1L);
        singleRole.setName("EMPLOYEE");

        Set<Role> singleRoleSet = new HashSet<>();
        singleRoleSet.add(singleRole);

        testUser.setRoles(singleRoleSet);

        // Act
        String token = jwtUtils.generateToken(testUser);

        // Assert
        assertNotNull(token);

        Key signingKey = getSignInKey();
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();

        String roles = claims.get("roles", String.class);
        assertEquals("EMPLOYEE", roles);
    }

    @Test
    void getUsernameFromToken_WithValidToken_ReturnsUsername() {
        // Arrange
        String token = jwtUtils.generateToken(testUser);

        // Act
        String username = jwtUtils.getUsernameFromToken(token);

        // Assert
        assertEquals("johndoe", username);
    }

    @Test
    void getUsernameFromToken_WithInvalidToken_ThrowsException() {
        // Arrange
        String invalidToken = "invalid.token.here";

        // Act & Assert
        assertThrows(Exception.class, () -> {
            jwtUtils.getUsernameFromToken(invalidToken);
        });
    }

    @Test
    void getUsernameFromToken_WithMalformedToken_ThrowsException() {
        // Arrange
        String malformedToken = "this-is-not-a-jwt-token";

        // Act & Assert
        assertThrows(Exception.class, () -> {
            jwtUtils.getUsernameFromToken(malformedToken);
        });
    }

    @Test
    void validateToken_WithValidToken_ReturnsTrue() {
        // Arrange
        String token = jwtUtils.generateToken(testUser);

        // Act
        boolean isValid = jwtUtils.validateToken(token);

        // Assert
        assertTrue(isValid);
    }

    @Test
    void validateToken_WithInvalidToken_ReturnsFalse() {
        // Arrange
        String invalidToken = "invalid.token.here";

        // Act
        boolean isValid = jwtUtils.validateToken(invalidToken);

        // Assert
        assertFalse(isValid);
    }

    @Test
    void validateToken_WithMalformedToken_ReturnsFalse() {
        // Arrange
        String malformedToken = "this-is-not-a-jwt-token";

        // Act
        boolean isValid = jwtUtils.validateToken(malformedToken);

        // Assert
        assertFalse(isValid);
    }

    @Test
    void validateToken_WithNullToken_ReturnsFalse() {
        // Act
        boolean isValid = jwtUtils.validateToken(null);

        // Assert
        assertFalse(isValid);
    }

    @Test
    void validateToken_WithEmptyToken_ReturnsFalse() {
        // Arrange
        String emptyToken = "";

        // Act
        boolean isValid = jwtUtils.validateToken(emptyToken);

        // Assert
        assertFalse(isValid);
    }

    @Test
    void validateToken_WithExpiredToken_ReturnsFalse() {
        // Arrange - Create an expired token manually
        Date pastDate = new Date(System.currentTimeMillis() - 1000000); // 1000 seconds ago
        Key signingKey = getSignInKey();

        String expiredToken = Jwts.builder()
                .setSubject(testUser.getUsername())
                .setIssuedAt(pastDate)
                .setExpiration(pastDate) // Already expired
                .signWith(signingKey)
                .compact();

        // Act
        boolean isValid = jwtUtils.validateToken(expiredToken);

        // Assert
        assertFalse(isValid);
    }

    @Test
    void generateToken_IncludesIssuedAtClaim() {
        // Act
        String token = jwtUtils.generateToken(testUser);

        // Assert
        Key signingKey = getSignInKey();
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();

        Date issuedAt = claims.getIssuedAt();
        assertNotNull(issuedAt);
        assertTrue(issuedAt.before(new Date()) || issuedAt.equals(new Date()));
    }

    @Test
    void generateToken_IncludesExpirationClaim() {
        // Act
        String token = jwtUtils.generateToken(testUser);

        // Assert
        Key signingKey = getSignInKey();
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();

        Date expiration = claims.getExpiration();
        assertNotNull(expiration);
        assertTrue(expiration.after(new Date()));

        // Should expire approximately 24 hours from now (allowing for test execution time)
        long expectedExpirationTime = System.currentTimeMillis() + 86400000; // 24 hours
        long actualExpirationTime = expiration.getTime();
        long timeDifference = Math.abs(expectedExpirationTime - actualExpirationTime);
        assertTrue(timeDifference < 60000); // Allow 1 minute difference for test execution
    }

    @Test
    void generateToken_WithUserWithoutRoles_GeneratesTokenWithEmptyRoles() {
        // Arrange
        testUser.setRoles(new HashSet<>());

        // Act
        String token = jwtUtils.generateToken(testUser);

        // Assert
        assertNotNull(token);

        Key signingKey = getSignInKey();
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();

        String roles = claims.get("roles", String.class);
        assertEquals("", roles);
    }

    // Helper method to get signing key (same logic as in JwtUtils)
    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(java.util.Base64.getEncoder().encodeToString(jwtSecret.getBytes()));
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
