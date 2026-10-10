@ProjectTask
Feature: Task completion checkbox
  As a user
  I want to mark tasks as completed with a single click
  So that the daily progress is updated

  Background:
    Given I am signed in as a "MEMBER"
    And a project from "2026-10-12" to "2027-01-29"
    And the project has a task "Validar prototipo con usuarios"

  @US58
  Scenario: Check a task as completed
    When I set the task completion to true
    Then the response status should be 200
    And the task status should be "DONE"
    And the response should contain the field "completedAt"

  @US58
  Scenario: Uncheck a completed task
    Given the task is marked as completed
    When I set the task completion to false
    Then the response status should be 200
    And the task status should be "TODO"
