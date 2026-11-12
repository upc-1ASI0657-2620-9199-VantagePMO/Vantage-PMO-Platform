# Vantage PMO Platform

Plataforma de microservicios de **Vantage PMO**, startup **MDEPS** — curso *1ASI0657 Fundamentos de Arquitectura de Software* (UPC, ciclo 2026-20, sección 9199).

Este repositorio es la refactorización del monolito modular del ciclo anterior
([Vantage-PMO-Back-End](https://github.com/BL-Aplicaciones-Web-1ASI0730-2610-12158/Vantage-PMO-Back-End), ASP.NET Core)
hacia la arquitectura de microservicios diseñada con ADD en el Capítulo IV del informe.

## Arquitectura (Sprint 3)

```
                                   ┌──────────────────────────┐
  Cliente ───────────────────────▶ │       API Gateway        │ :3000  JWT · routing · circuit breaker · Swagger agregado
                                   └────────────┬─────────────┘
      ┌──────────────┬──────────────┬───────────┴──┬──────────────┬──────────────┐
      ▼              ▼              ▼              ▼              ▼              ▼
┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐
│ IAM      │  │ Project&Task │  │ Resource │  │ Notification │  │ Document │  │ Risk     │
│ :3001    │  │ :3002        │  │ :3003    │  │ :3004        │  │ :3005    │  │ :3006    │
└────┬─────┘  └──────┬───────┘  └────┬─────┘  └──────┬───────┘  └────┬─────┘  └────┬─────┘
     └───────────────┴───────────────┴──────┬────────┴───────────────┴─────────────┘
                                            ▼
                      Event broker: Redis Streams (Render Key Value)
                      un consumer group por servicio · libs/event-bus

   PostgreSQL: un esquema privado por servicio (iam, project_task, resource, notification, document, risk)
```

| Microservicio | Bounded Context | Endpoints principales |
|---|---|---|
| `api-gateway` | — | Punto único de entrada, `/swagger`, `/health` |
| `iam-service` | Identity & Access Management | `POST /api/v1/authentication/sign-up`, `POST /api/v1/authentication/sign-in`, `GET /api/v1/users`, `GET /api/v1/users/me` |
| `project-task-service` | Project & Task Management (core domain) | `POST/GET /api/v1/projects`, `PUT /api/v1/projects/{id}`, `PATCH /api/v1/projects/{id}/status`, `POST /api/v1/projects/{id}/milestones`, `POST/GET /api/v1/projects/{id}/tasks`, `PATCH /api/v1/tasks/{id}/assignee`, `PATCH /api/v1/tasks/{id}/completion`, `PATCH /api/v1/projects/{id}/milestones/{mid}/completion`, `POST /api/v1/alerts/scan` |
| `resource-service` | Resource Management | `POST/GET /api/v1/projects/{id}/allocations`, `PATCH/DELETE /api/v1/allocations/{id}`, `GET /api/v1/resources/availability` |
| `notification-service` | Notification | `GET /api/v1/notifications`, `GET /api/v1/notifications/unread-count`, `PATCH /api/v1/notifications/{id}/read`, `PATCH /api/v1/notifications/read-all` |
| `document-service` | Document Management | `POST/GET /api/v1/projects/{id}/documents` (multipart), `GET /api/v1/documents/{id}`, `GET /api/v1/documents/{id}/content`, `POST/GET /api/v1/projects/{id}/milestones/{mid}/document-requirements`, `DELETE /api/v1/document-requirements/{id}` |
| `risk-service` | Risk Management | `POST/GET /api/v1/projects/{id}/risks`, `GET /api/v1/risks/priority`, `GET /api/v1/risks/{id}`, `POST /api/v1/risks/{id}/assessments`, `PATCH /api/v1/risks/{id}/status` |

### Eventos de integración

| Evento | Publica | Consume |
|---|---|---|
| `iam.user-registered` | IAM | Resource (réplica de miembros) |
| `projects.project-registered` / `project-updated` / `project-status-changed` | Project & Task | Resource, Document y Risk (réplica de proyectos) |
| `projects.task-assigned` | Project & Task | Notification |
| `projects.milestone-due-soon` (24 h, US09) | Project & Task (tarea programada) | Notification |
| `projects.project-stalled` (72 h, US10/US53) | Project & Task (tarea programada) | Notification |
| `resources.member-allocated` / `member-overallocated` | Resource | Notification |
| `projects.milestone-added` / `milestone-completed` | Project & Task | Document (réplica de hitos) |
| `documents.requirement-defined` / `requirement-fulfilled` / `requirement-removed` | Document | Project & Task (validación del cierre de hitos, US22) |
| `documents.document-uploaded` | Document | — (auditoría) |
| `risks.critical-risk-identified` | Risk | Notification |

La librería `libs/event-bus` (`@vantage-pmo/event-bus`) define los puertos `EventPublisher`/`EventSubscriber` y dos adaptadores:
`RedisStreamsEventBus` (XADD, XREADGROUP con consumer groups y XACK; entrega al menos una vez) e `InMemoryEventBus` (pruebas).
Los consumidores son idempotentes (clave de negocio por evento).

Cada microservicio sigue las capas de DDD: `domain` (agregados, value objects, comandos, queries, puertos de repositorio),
`application` (command/query services — CQRS ligero), `infrastructure` (TypeORM + PostgreSQL) e `interfaces/rest` (controladores, resources, assemblers).

**Stack:** Node.js 22 · TypeScript · NestJS 11 · Express 5 · TypeORM · PostgreSQL 16 · Redis Streams (ioredis) · JWT · BCrypt · opossum (circuit breaker) · OpenAPI/Swagger · Jest · Cucumber.js (Gherkin) · Docker.

## Ejecutar en local

Con Docker:

```bash
docker compose up --build
# Swagger: http://localhost:3000/swagger
```

Sin Docker (PostgreSQL local con las bases `iam_db`, `project_task_db`, `resource_db`, `notification_db`, `document_db`, `risk_db` y Redis en el puerto 6379):

```bash
cd libs/event-bus && npm ci && npm run build      # librería compartida, primero
cd iam-service && cp .env.example .env && npm ci && npm run start:dev
cd project-task-service && cp .env.example .env && npm ci && npm run start:dev
cd resource-service && cp .env.example .env && npm ci && npm run start:dev
cd notification-service && cp .env.example .env && npm ci && npm run start:dev
cd document-service && cp .env.example .env && npm ci && npm run start:dev
cd risk-service && cp .env.example .env && npm ci && npm run start:dev
cd api-gateway && cp .env.example .env && npm ci && npm run start:dev
```

Todos los servicios deben usar el mismo `JWT_SECRET`.

## Pruebas

| Tipo | Ubicación | Comando |
|---|---|---|
| Unitarias (dominio, servicios, gateway) | `*/test/unit`, `libs/event-bus/test` | `npm test` en cada servicio |
| Aceptación BDD (Gherkin) | `tests/acceptance/features` | `cd tests/acceptance && npm ci && BASE_URL=http://localhost:3000 npm test` |
| Colecciones Postman | `postman/` | `npx newman run postman/Vantage-PMO-Sprint3.postman_collection.json` (desde la raíz; usa `postman/fixtures`) |

## Flujo de trabajo (GitFlow)

- `main`: versiones liberadas (tags `vX.Y.Z`, Semantic Versioning).
- `develop`: integración de funcionalidades.
- `feature/<bounded-context>-<descripcion>`: una rama por funcionalidad, se integra a `develop` con `--no-ff`.
- `release/X.Y.Z` y `hotfix/X.Y.Z`: preparación de versiones y correcciones urgentes.
- Mensajes de commit con **Conventional Commits** (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `ci:`, `refactor:`).

## Despliegue

`render.yaml` define el Blueprint para Render (plan gratuito): API Gateway, seis microservicios y una instancia Key Value como broker de eventos. Los servicios que usan `libs/event-bus` se construyen con la raíz del repositorio como contexto de Docker.

Producción: https://vantage-pmo-api-gateway.onrender.com/swagger (las instancias gratuitas se suspenden por inactividad; la primera petición puede tardar ~50 s).
