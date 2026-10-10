# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.2] - 2026-10-10

### Fixed
- Blueprint de Render: se reutiliza la instancia PostgreSQL gratuita existente del workspace (el plan gratuito permite solo una); cada microservicio mantiene su esquema privado.

## [1.0.1] - 2026-10-10

### Fixed
- Blueprint de Render: rutas explícitas de `dockerContext`/`dockerfilePath` por servicio, región fija y `buildFilter` para que cada microservicio solo se redespliegue cuando cambia su carpeta.

## [1.0.0] - 2026-10-10 — Sprint 1

### Added
- **API Gateway**: punto único de entrada, validación centralizada de JWT, enrutamiento por bounded context, circuit breaker por servicio y Swagger UI agregado.
- **IAM Service**: registro con contraseña cifrada con BCrypt (US51), inicio de sesión (US20) y emisión de JWT (US41), consulta de usuarios.
- **Project & Task Service**: registro de proyectos con cliente, fechas y presupuesto (US01, US43, US46), portafolio paginado con KPIs (US47), cambio de fase con máquina de estados (US26, US48), hitos, creación de tareas, asignación de responsables (US04) y marcado de tareas completadas (US58).
- Pruebas unitarias (Jest), pruebas de aceptación BDD en Gherkin (Cucumber.js) y colección Postman.
- Docker Compose (una base de datos por servicio), pipeline de GitHub Actions y Blueprint de Render.
