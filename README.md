# Vantage PMO Platform

Plataforma de microservicios de **Vantage PMO**, startup **MDEPS** — curso *1ASI0657 Fundamentos de Arquitectura de Software* (UPC, ciclo 2026-20, sección 9199).

Este repositorio es la refactorización del monolito modular del ciclo anterior
([Vantage-PMO-Back-End](https://github.com/BL-Aplicaciones-Web-1ASI0730-2610-12158/Vantage-PMO-Back-End), ASP.NET Core)
hacia la arquitectura de microservicios diseñada con ADD en el Capítulo IV del informe.

## Arquitectura (Sprint 1)

```
                 ┌──────────────────────────┐
  Cliente ─────▶ │       API Gateway        │  :3000  JWT · routing · circuit breaker · Swagger agregado
                 └────────────┬─────────────┘
              ┌───────────────┴────────────────┐
              ▼                                ▼
   ┌─────────────────────┐          ┌──────────────────────────┐
   │     IAM Service     │ :3001    │  Project & Task Service  │ :3002
   │ usuarios · BCrypt · │          │ proyectos · hitos ·      │
   │ emisión de JWT      │          │ tareas · portafolio      │
   └──────────┬──────────┘          └────────────┬─────────────┘
              ▼                                  ▼
       PostgreSQL (iam)                PostgreSQL (project_task)     ← Database per Service
```

| Microservicio | Bounded Context | Endpoints principales |
|---|---|---|
| `api-gateway` | — | Punto único de entrada, `/swagger`, `/health` |
| `iam-service` | Identity & Access Management | `POST /api/v1/authentication/sign-up`, `POST /api/v1/authentication/sign-in`, `GET /api/v1/users`, `GET /api/v1/users/me` |
| `project-task-service` | Project & Task Management (core domain) | `POST/GET /api/v1/projects`, `PUT /api/v1/projects/{id}`, `PATCH /api/v1/projects/{id}/status`, `POST /api/v1/projects/{id}/milestones`, `POST/GET /api/v1/projects/{id}/tasks`, `PATCH /api/v1/tasks/{id}/assignee`, `PATCH /api/v1/tasks/{id}/completion` |

Cada microservicio sigue las capas de DDD: `domain` (agregados, value objects, comandos, queries, puertos de repositorio),
`application` (command/query services — CQRS ligero), `infrastructure` (TypeORM + PostgreSQL) e `interfaces/rest` (controladores, resources, assemblers).

**Stack:** Node.js 22 · TypeScript · NestJS 11 · Express 5 · TypeORM · PostgreSQL 16 · JWT · BCrypt · opossum (circuit breaker) · OpenAPI/Swagger · Jest · Cucumber.js (Gherkin) · Docker.

## Ejecutar en local

Con Docker:

```bash
docker compose up --build
# Swagger: http://localhost:3000/swagger
```

Sin Docker (PostgreSQL local con las bases `iam_db` y `project_task_db`):

```bash
cd iam-service && cp .env.example .env && npm ci && npm run start:dev
cd project-task-service && cp .env.example .env && npm ci && npm run start:dev
cd api-gateway && cp .env.example .env && npm ci && npm run start:dev
```

Todos los servicios deben usar el mismo `JWT_SECRET`.

## Pruebas

| Tipo | Ubicación | Comando |
|---|---|---|
| Unitarias (dominio, servicios, gateway) | `*/test/unit` | `npm test` en cada servicio |
| Aceptación BDD (Gherkin) | `tests/acceptance/features` | `cd tests/acceptance && npm ci && BASE_URL=http://localhost:3000 npm test` |
| Colección Postman | `postman/` | `npx newman run postman/Vantage-PMO-Sprint1.postman_collection.json` |

## Flujo de trabajo (GitFlow)

- `main`: versiones liberadas (tags `vX.Y.Z`, Semantic Versioning).
- `develop`: integración de funcionalidades.
- `feature/<bounded-context>-<descripcion>`: una rama por funcionalidad, se integra a `develop` con `--no-ff`.
- `release/X.Y.Z` y `hotfix/X.Y.Z`: preparación de versiones y correcciones urgentes.
- Mensajes de commit con **Conventional Commits** (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `ci:`, `refactor:`).

## Despliegue

`render.yaml` define el Blueprint para Render (plan gratuito); cada servicio se construye desde su `Dockerfile`.

Producción: https://vantage-pmo-api-gateway.onrender.com/swagger (las instancias gratuitas se suspenden por inactividad; la primera petición puede tardar ~50 s).
