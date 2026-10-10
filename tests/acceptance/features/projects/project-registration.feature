@ProjectTask
Feature: Project registration
  As a PMO Lead
  I want to register projects with their client, dates and budget
  So that the portfolio keeps its administrative order

  Background:
    Given I am signed in as a "PROJECT_MANAGER"

  @US01 @US43 @US46
  Scenario: Register a project with its master data
    When I create a project with:
      | name      | Implementación ERP Logística |
      | client    | Transportes Andinos S.A.C.   |
      | startDate | 2026-10-12                   |
      | endDate   | 2027-01-29                   |
      | budget    | 85000                        |
    Then the response status should be 201
    And the project status should be "PLANNED"
    And the response field "client" should be "Transportes Andinos S.A.C."
    And the response field "budget" should be 85000

  @US01 @US46
  Scenario: The end date cannot be before the start date
    When I create a project with:
      | name      | Proyecto inválido |
      | client    | Cliente X         |
      | startDate | 2026-12-01        |
      | endDate   | 2026-11-01        |
      | budget    | 1000              |
    Then the response status should be 422
    And the error detail should be "The project end date cannot be before its start date."

  @US46
  Scenario: Mandatory fields are validated
    When I create a project with:
      | name      |            |
      | client    | Cliente X  |
      | startDate | 2026-12-01 |
      | endDate   | 2026-12-31 |
      | budget    | 1000       |
    Then the response status should be 400

  @US01
  Scenario: Add a milestone inside the project period
    Given a project from "2026-10-12" to "2027-01-29"
    When I add the milestone "Go-live inventario" due on "2026-12-15"
    Then the response status should be 201
    And the response field "status" should be "PENDING"
