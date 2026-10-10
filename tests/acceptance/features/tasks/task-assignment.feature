@ProjectTask
Feature: Task assignment
  As a coordinator
  I want to assign members to tasks
  So that responsibilities are delegated clearly

  Background:
    Given I am signed in as a "PROJECT_MANAGER"
    And a project from "2026-10-12" to "2027-01-29"
    And the project has a task "Diseñar modelo de datos"

  @US04
  Scenario: Assign a responsible member to a task
    Given a team member is registered
    When I assign the task to the team member
    Then the response status should be 200
    And the task should be assigned to the team member
    And the task status should be "IN_PROGRESS"

  @US04
  Scenario: A completed task cannot be reassigned
    Given a team member is registered
    And the task is marked as completed
    When I assign the task to the team member
    Then the response status should be 422
