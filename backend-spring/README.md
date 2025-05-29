# School Employee Management System - Backend

This is the backend REST API for the School Management System. It powers employee, leave, and authentication features for the school environment.

## Features
- RESTful API for managing employees and leave requests
- User authentication with JWT
default roles: ADMIN, MANAGER, EMPLOYEE
- Secure endpoints based on user roles
- Data persistence using Spring Data JPA
- DTOs, input validation, and error handling

## Tech Stack & Dependencies
- **Java 17+**
- **Spring Boot 3.x**
- **Spring Security** (JWT authentication)
- **Spring Data JPA**
- **H2 Database** (in-memory default; can be changed)
- **Lombok** (for concise code)

## Project Structure
```
src/main/java/com/school/management/
  controller/   # REST controllers
  entity/       # Entity models
  repository/   # JPA repositories
  service/      # Business logic/services
  payload/      # DTOs & API payloads
  config/       # Security config
```

## Setup & Installation
### Prerequisites
- Java 17 or newer
- Maven (or use mvnw wrapper)

### Running Locally
1. Move to the backend directory:
   ```sh
   cd uploads/backend-spring
   ```
2. Run with Maven wrapper:
   ```sh
   ./mvnw spring-boot:run
   ```
   Or with Maven:
   ```sh
   mvn spring-boot:run
   ```

By default, the server runs at http://localhost:8080

### API Endpoints
- All endpoints are prefixed with `/api`.
- Authentication:
  - POST `/api/auth/login` — login, returns JWT
  - POST `/api/auth/register` — register a new user
- Employees: CRUD at `/api/employees`
- Leave Requests: CRUD at `/api/leaverequests`, with role-based access

See controller classes in `src/main/java/com/school/management/controller/` for all endpoints and parameters.

### Database Configuration
- Default uses H2.
- To use PostgreSQL/MySQL/etc, update `src/main/resources/application.properties` accordingly.

## Testing
You can add and run JUnit tests under `src/test/java/`.

## Environment Variables
Adjust configuration in `application.properties` for:
- Data source
- JWT secret
- Server port

## Deployment
This is a standard Spring Boot app; it can be built into a JAR (`mvn clean package`) and run/deployed anywhere Java is supported.

## Contribution
Pull requests are welcome. For major changes, please open an issue first.

## Contact
For API or server issues, please contact the backend maintainer.

---
*© 2025 School Management System – Backend*
