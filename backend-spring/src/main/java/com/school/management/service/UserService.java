package com.school.management.service;

import com.school.management.entity.User;
import com.school.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }

    public User updateUserProfile(String username, Map<String, String> updates) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return null;
        }

        User user = userOpt.get();

        // Update email if provided
        if (updates.containsKey("email")) {
            String email = updates.get("email");
            if (email != null && (email.isEmpty() || email.contains("@"))) {
                user.setEmail(email.isEmpty() ? null : email);
            }
        }

        return userRepository.save(user);
    }
}
