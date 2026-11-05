@Resource
Feature: Resource availability
  As a PMO
  I want to see the available capacity of each member
  So that I can decide new assignments

  Background:
    Given I am signed in as a "PMO_LEAD"
    And a project from "2026-11-02" to "2027-01-29"
    And a team member is registered
    And the team member is allocated with 70 percent from "2026-11-09" to "2026-12-18"

  @US15
  Scenario: See the free capacity of a member in a period
    When I request the resource availability from "2026-11-09" to "2026-12-18"
    Then the response status should be 200
    And the team member should appear with 70 percent allocated, 30 percent available and status "PARTIAL"

  @US15
  Scenario: A member without allocations in the period is fully available
    When I request the resource availability from "2027-01-05" to "2027-01-20"
    Then the team member should appear with 0 percent allocated, 100 percent available and status "AVAILABLE"

  @US15
  Scenario: Filter members by minimum free capacity
    When I request the resource availability from "2026-11-09" to "2026-12-18" with at least 40 percent available
    Then the response status should be 200
    And the team member should not appear in the availability list

  @US15
  Scenario: Reject a period whose end is before its start
    When I request the resource availability from "2026-12-18" to "2026-11-09"
    Then the response status should be 422
