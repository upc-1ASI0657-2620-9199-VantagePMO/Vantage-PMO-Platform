@ProjectTask @Notification
Feature: Project inactivity alert
  As a PMO
  I want to know which projects had no changes in 72 hours
  So that I can follow up stalled projects

  Background:
    Given I am signed in as a "PMO_LEAD"
    And a project from "2026-11-02" to "2027-01-29"

  @US10 @US53
  Scenario: Flag a project without changes for 72 hours
    When the alert scan runs 96 hours from now
    Then the response status should be 200
    And the scan should report a "projects.project-stalled" event for the project
    And I should receive a "PROJECT_STALLED" notification about the project

  @US10 @US53
  Scenario: A project with recent changes is not flagged
    When the alert scan runs 24 hours from now
    Then the scan should not report a "projects.project-stalled" event for the project

  @US10
  Scenario: Closed projects are not flagged
    Given I change the project status to "IN_PROGRESS"
    And I change the project status to "COMPLETED"
    When the alert scan runs 96 hours from now
    Then the scan should not report a "projects.project-stalled" event for the project
