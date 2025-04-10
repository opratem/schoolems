package com.schoolems.schoolems.entity;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import static org.junit.jupiter.api.Assertions.assertNotNull;


    @DataJpaTest
    class
    UserEntityTest {

        @Autowired
        private TestEntityManager em;

        @Test
        void userShouldPersist() {
            User user = new User();
            user.setEmail("test@test.com");
            user.setPassword("encoded");
            user.setRole("MANAGER"); // Using your actual role
            User saved = em.persistFlushFind(user);
            assertNotNull(saved.getId());
        }
}
