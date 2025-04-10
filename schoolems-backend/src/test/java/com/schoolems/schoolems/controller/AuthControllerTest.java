package com.schoolems.schoolems.controller;

import com.schoolems.schoolems.SchoolemsApplication;
import com.schoolems.schoolems.entity.User;
import com.schoolems.schoolems.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = SchoolemsApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Test
    void publicEndpoint_ShouldBeAccessible() throws Exception {
        mockMvc.perform(get("/api/public"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldSupportAllRoleTypes() {
        for (String role : List.of("EMPLOYEE", "MANAGER", "ADMIN")) {
            User user = User.builder()
                    .email(role.toLowerCase() + "@test.com")
                    .password("encoded")
                    .role(role)
                    .build();

            assertDoesNotThrow(() -> userRepository.save(user));
        }
    }
}
