# 🎓 School Employee Management System (Full Stack)

A modern web platform for managing school employees and processing staff leave requests. This full-stack solution consists of a robust Java Spring Boot backend and a fast, responsive React TypeScript frontend.

---

## 🧱 Project Structure

school-employee-management/
├── backend/ # Spring Boot API
├── frontend/ # React + TypeScript SPA
├── README.md # Project overview (this file)
├── .gitignore

yaml
Copy
Edit

---

## 🚀 Features Overview

### ✅ Core Features
- Employee management with role-based permissions (Admin, Manager, Employee)
- Leave request submission and approval workflows
- Authentication with JWT and secure session management
- Real-time dashboards and visual reporting
- Role-based dashboards with feature gating
- Leave calendar, file attachments, and export capabilities

---

## ⚙️ Tech Stack

### Backend
- Java 17+
- Spring Boot 3
- Spring Security (JWT)
- Spring Data JPA + H2 (default)
- Maven
- Lombok

### Frontend
- React 18
- TypeScript
- Vite
- Axios
- React Router v6
- Styled Components / CSS Modules
- State via React Context + Hooks

---

## 📦 Installation & Setup

### Prerequisites
- Java 17+ and Maven
- Node.js 18+ and [Bun](https://bun.sh)
- Git

### Clone the Repo
```bash
git clone https://github.com/opratem/schoolems.git
cd schoolems
