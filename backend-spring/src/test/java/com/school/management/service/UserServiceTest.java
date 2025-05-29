package com.school.management.service;

import com.school.management.entity.User;
import com.school.management.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .username("johndoe")
                .email("john.doe@company.com")
                .password("hashedPassword")
                .build();
    }

    @Test
    void findByUsername_WithExistingUser_ReturnsUser() {
        // Arrange
        String username = "johndoe";
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));

        // Act
        Optional<User> result = userService.findByUsername(username);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(testUser, result.get());
        verify(userRepository).findByUsername(username);
    }

    @Test
    void findByUsername_WithNonexistentUser_ReturnsEmpty() {
        // Arrange
        String username = "nonexistent";
        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        // Act
        Optional<User> result = userService.findByUsername(username);

        // Assert
        assertFalse(result.isPresent());
        verify(userRepository).findByUsername(username);
    }

    @Test
    void save_WithValidUser_ReturnsUser() {
        // Arrange
        when(userRepository.save(testUser)).thenReturn(testUser);

        // Act
        User result = userService.save(testUser);

        // Assert
        assertEquals(testUser, result);
        verify(userRepository).save(testUser);
    }

    @Test
    void getUserByUsername_WithExistingUser_ReturnsUser() {
        // Arrange
        String username = "johndoe";
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));

        // Act
        User result = userService.getUserByUsername(username);

        // Assert
        assertEquals(testUser, result);
        verify(userRepository).findByUsername(username);
    }

    @Test
    void getUserByUsername_WithNonexistentUser_ReturnsNull() {
        // Arrange
        String username = "nonexistent";
        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        // Act
        User result = userService.getUserByUsername(username);

        // Assert
        assertNull(result);
        verify(userRepository).findByUsername(username);
    }

    @Test
    void updateUserProfile_WithValidEmailUpdate_UpdatesAndReturnsUser() {
        // Arrange
        String username = "johndoe";
        String newEmail = "newemail@company.com";
        Map<String, String> updates = new HashMap<>();
        updates.put("email", newEmail);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = userService.updateUserProfile(username, updates);

        // Assert
        assertNotNull(result);
        assertEquals(newEmail, testUser.getEmail());
        verify(userRepository).findByUsername(username);
        verify(userRepository).save(testUser);
    }

    @Test
    void updateUserProfile_WithEmptyEmailUpdate_SetsEmailToNull() {
        // Arrange
        String username = "johndoe";
        Map<String, String> updates = new HashMap<>();
        updates.put("email", "");

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = userService.updateUserProfile(username, updates);

        // Assert
        assertNotNull(result);
        assertNull(testUser.getEmail());
        verify(userRepository).findByUsername(username);
        verify(userRepository).save(testUser);
    }

    @Test
    void updateUserProfile_WithInvalidEmail_DoesNotUpdateEmail() {
        // Arrange
        String username = "johndoe";
        String originalEmail = testUser.getEmail();
        Map<String, String> updates = new HashMap<>();
        updates.put("email", "invalid-email"); // No @ symbol

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = userService.updateUserProfile(username, updates);

        // Assert
        assertNotNull(result);
        assertEquals(originalEmail, testUser.getEmail()); // Should remain unchanged
        verify(userRepository).findByUsername(username);
        verify(userRepository).save(testUser);
    }

    @Test
    void updateUserProfile_WithNullEmail_DoesNotUpdateEmail() {
        // Arrange
        String username = "johndoe";
        String originalEmail = testUser.getEmail();
        Map<String, String> updates = new HashMap<>();
        updates.put("email", null);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = userService.updateUserProfile(username, updates);

        // Assert
        assertNotNull(result);
        assertEquals(originalEmail, testUser.getEmail()); // Should remain unchanged
        verify(userRepository).findByUsername(username);
        verify(userRepository).save(testUser);
    }

    @Test
    void updateUserProfile_WithNonexistentUser_ReturnsNull() {
        // Arrange
        String username = "nonexistent";
        Map<String, String> updates = new HashMap<>();
        updates.put("email", "newemail@company.com");

        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        // Act
        User result = userService.updateUserProfile(username, updates);

        // Assert
        assertNull(result);
        verify(userRepository).findByUsername(username);
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateUserProfile_WithEmptyUpdates_StillSavesUser() {
        // Arrange
        String username = "johndoe";
        Map<String, String> updates = new HashMap<>();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = userService.updateUserProfile(username, updates);

        // Assert
        assertNotNull(result);
        verify(userRepository).findByUsername(username);
        verify(userRepository).save(testUser);
    }

    @Test
    void updateUserProfile_WithNonEmailUpdates_IgnoresOtherFields() {
        // Arrange
        String username = "johndoe";
        String originalEmail = testUser.getEmail();
        Map<String, String> updates = new HashMap<>();
        updates.put("username", "newusername");
        updates.put("password", "newpassword");
        updates.put("someotherfield", "somevalue");

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = userService.updateUserProfile(username, updates);

        // Assert
        assertNotNull(result);
        assertEquals(originalEmail, testUser.getEmail()); // Should remain unchanged
        assertEquals("johndoe", testUser.getUsername()); // Should remain unchanged
        verify(userRepository).findByUsername(username);
        verify(userRepository).save(testUser);
    }
}
