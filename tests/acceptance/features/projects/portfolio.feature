@ProjectTask
Feature: Project portfolio
  As a PMO Lead
  I want to list the active projects with their basic KPIs
  So that I can follow the portfolio at a glance

  Background:
    Given I am signed in as a "PMO_LEAD"

  @US47 @US43
  Scenario: The portfolio returns the progress of each project
    Given a project from "2026-10-12" to "2027-01-29"
    And the project has 4 tasks of which 1 are completed
    When I request the portfolio filtered by the project client
    Then the response status should be 200
    And the portfolio should contain the project with 4 tasks, 1 completed and 25 percent progress

  @US47
  Scenario: The portfolio is paginated
    Given 3 projects exist for the same client
    When I request page 1 of size 2 of the portfolio filtered by that client
    Then the response status should be 200
    And the page should contain 2 items out of 3 in 2 pages
