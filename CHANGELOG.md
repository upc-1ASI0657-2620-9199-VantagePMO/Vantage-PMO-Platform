# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [Semantic Versioning](https://semver.org/lang/es/).

## [1.1.0] - 2026-11-05 — Sprint 2

### Added
- **libs/event-bus** (`@vantage-pmo/event-bus`): librería propia de publicación/suscripción con puertos `EventPublisher`/`EventSubscriber` y adaptadores Redis Streams (consumer groups, ACK explícito, reintentos) e in-memory.
- **Resource Service**: asignación de miembros a proyectos con rol, porcentaje de dedicación y periodo (US14), detección de sobreasignación y disponibilidad por periodo (US15). Réplicas locales de miembros y proyectos sincronizadas por eventos.
- **Notification Service**: notificaciones in-app generadas a partir de eventos, consumo idempotente, campanita con contador de no leídas (US63) y canal de correo para alertas urgentes.
- **Project & Task Service**: eventos de integración (proyecto registrado/actualizado/cambio de estado, tarea asignada) y tarea programada de alertas: hitos que vencen en 24 h (US09) y proyectos sin cambios en 72 h (US10, US53), con `POST /api/v1/alerts/scan`.
- **IAM Service**: evento `iam.user-registered` y reenvío del directorio de usuarios al iniciar.
- **API Gateway**: rutas y circuit breakers para Resource y Notification; Swagger agregado con los cuatro servicios.
- Pruebas unitarias, 23 escenarios BDD nuevos y colección Postman del Sprint 2.
- Render: instancia Key Value (`vantage-pmo-event-broker`) y dos nuevos web services.

### Changed
- Las imágenes Docker de los servicios que usan la librería se construyen desde la raíz del repositorio.

## [1.0.3] - 2026-10-10

### Fixed
- Project & Task Service: la consulta del portafolio (read model) califica las tablas con el esquema del servicio cuando se configura `DB_SCHEMA`.

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
