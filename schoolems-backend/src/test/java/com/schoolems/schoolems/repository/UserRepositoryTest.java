package com.schoolems.schoolems.repository;

import com.schoolems.schoolems.dto.UserRegistrationDto;
import com.schoolems.schoolems.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
public class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void existsByEmail_ShouldReturnFalseForNonExistentEmail() {
        assertFalse(userRepository.existsByEmail("nonexistent@test.com"));
    }

    @Test
    void existsByEmail_ShouldReturnTrueWhenEmailExists() {
        User user = User.builder()
                .email("test@example.com")
                .password(passwordEncoder.encode("password123"))
                .role("EMPLOYEE") // Using your actual role
                .build();


        }

        @Test
        void findByEmail_ShouldReturnUser() {
            User user = User.builder()
                    .email("find@test.com")
                    .password(passwordEncoder.encode("password"))
                    .role("EMPLOYEE")
                    .build();
            entityManager.persistAndFlush(user);

            Optional<User> found = userRepository.findByEmail("find@test.com");
            assertTrue(found.isPresent());
            assertEquals("find@test.com", found.get().getEmail());
        }

}

@TestConfiguration
class TestSecurityConfig {
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}



