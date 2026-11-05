@ProjectTask @Notification
Feature: Milestone due alert
  As a project owner
  I want to be warned 24 hours before a milestone expires
  So that I can act before the deadline

  Background:
    Given I am signed in as a "PMO_LEAD"
    And a project from "2026-11-02" to "2027-01-29"
    And I add the milestone "Entrega de prototipo" due on "2026-12-10"

  @US09
  Scenario: Notify the owner when a milestone expires within 24 hours
    When the alert scan runs at "2026-12-10T08:00:00Z"
    Then the response status should be 200
    And the scan should report a "projects.milestone-due-soon" event for the project
    And I should receive a "MILESTONE_DUE_SOON" notification about the project

  @US09
  Scenario: No alert while the milestone is more than 24 hours away
    When the alert scan runs at "2026-12-08T08:00:00Z"
    Then the response status should be 200
    And the scan should not report a "projects.milestone-due-soon" event for the project

  @US09
  Scenario: Running the scan twice does not duplicate the alert
    When the alert scan runs at "2026-12-10T08:00:00Z"
    And the alert scan runs at "2026-12-10T09:00:00Z"
    Then I should have exactly 1 "MILESTONE_DUE_SOON" notification about the project

  @US09
  Scenario: Only the PMO can trigger the alert scan
    Given I am signed in as a "MEMBER"
    When the alert scan runs at "2026-12-10T08:00:00Z"
    Then the response status should be 403
