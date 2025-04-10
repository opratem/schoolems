package com.schoolems.schoolems;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
public class SchoolemsApplication {

	public static void main(String[] args) {

		SpringApplication.run(SchoolemsApplication.class, args);

		BCryptPasswordEncoder encoder =new BCryptPasswordEncoder();
		System.out.println("Encoded 'pelunmi': " +encoder.encode("pelunmi") );
		System.out.println("Matches check: " + encoder.matches("pelunmi", "[your_db_password_hash]"));

	}


	//Temporary method to generate a BCrypt hash (run once, then remove)




}
