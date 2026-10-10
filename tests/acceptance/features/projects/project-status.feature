@ProjectTask
Feature: Project status update
  As a project user
  I want to change the phase of a project
  So that stakeholders see its real progress

  Background:
    Given I am signed in as a "PROJECT_MANAGER"
    And a project from "2026-10-12" to "2027-01-29"

  @US26 @US48
  Scenario: Move a project through its lifecycle
    When I change the project status to "IN_PROGRESS"
    Then the response status should be 200
    And the project status should be "IN_PROGRESS"
    When I change the project status to "COMPLETED"
    Then the project status should be "COMPLETED"

  @US26 @US48
  Scenario: A phase cannot be skipped
    When I change the project status to "COMPLETED"
    Then the response status should be 422
    And the error detail should be "Cannot change project status from PLANNED to COMPLETED."

  @US48
  Scenario: Only the status field is modified
    When I change the project status to "IN_PROGRESS"
    Then the project client and budget should remain unchanged
