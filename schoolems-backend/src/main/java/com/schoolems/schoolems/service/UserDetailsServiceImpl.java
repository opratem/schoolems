package com.schoolems.schoolems.service;

import com.schoolems.schoolems.entity.User;
import com.schoolems.schoolems.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository){
        this.userRepository = userRepository;
    }
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        System.out.println("Searching for user: " +email);
        User user = userRepository.findByEmail(email)
        //return userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    System.out.println("User not found: "+email);
                    return new UsernameNotFoundException("User not found: ");

                });
        System.out.println("Found user: " +user.getEmail());
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                Collections.emptyList() //Start with no authorities for testing
        );

    }
}
