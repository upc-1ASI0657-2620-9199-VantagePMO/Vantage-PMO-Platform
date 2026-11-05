@Resource
Feature: Resource allocation
  As a PMO
  I want to link members to projects with a share of their time
  So that I can manage the workload of the team

  Background:
    Given I am signed in as a "PROJECT_MANAGER"
    And a project from "2026-11-02" to "2027-01-29"
    And a team member is registered

  @US14
  Scenario: Allocate a member to a project with a role and a share of time
    When I allocate the team member as "Analista funcional" with 50 percent from "2026-11-09" to "2026-12-18"
    Then the response status should be 201
    And the response field "memberTotalAllocation" should be 50
    And the response field "overallocated" should be "false"
    And the project team should include the team member with 50 percent

  @US14
  Scenario: Warn when the member exceeds 100 percent of capacity
    Given the team member is allocated with 70 percent from "2026-11-09" to "2026-12-18"
    And a second project from "2026-11-02" to "2027-01-29"
    When I allocate the team member to the second project with 50 percent from "2026-12-01" to "2026-12-31"
    Then the response status should be 201
    And the response field "memberTotalAllocation" should be 120
    And the response field "overallocated" should be "true"

  @US14
  Scenario: Reject an allocation outside the project period
    When I allocate the team member as "Desarrollador" with 50 percent from "2026-10-01" to "2026-11-30"
    Then the response status should be 422
    And the response field "type" should be "allocation-out-of-project-period"

  @US14
  Scenario: Reject a second overlapping allocation in the same project
    Given the team member is allocated with 40 percent from "2026-11-09" to "2026-12-18"
    When I allocate the team member as "Tester" with 20 percent from "2026-12-01" to "2026-12-31"
    Then the response status should be 422
    And the response field "type" should be "duplicated-allocation"

  @US14
  Scenario Outline: Reject shares of time outside 1 to 100 percent
    When I allocate the team member as "Analista" with <percentage> percent from "2026-11-09" to "2026-12-18"
    Then the response status should be 400

    Examples:
      | percentage |
      | 0          |
      | 101        |

  @US14
  Scenario: A team member cannot manage allocations
    Given I am signed in as a "MEMBER"
    When I allocate the team member as "Analista" with 50 percent from "2026-11-09" to "2026-12-18"
    Then the response status should be 403

  @US14
  Scenario: Release a member from the project
    Given the team member is allocated with 40 percent from "2026-11-09" to "2026-12-18"
    When I release the allocation
    Then the response status should be 204
    And the project team should be empty
