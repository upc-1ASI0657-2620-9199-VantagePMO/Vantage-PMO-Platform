@Notification
Feature: Notification bell
  As a user
  I want to see a red dot on the bell when I have new notifications
  So that I do not miss changes that concern me

  Background:
    Given I am signed in as a "PROJECT_MANAGER"
    And a project from "2026-11-02" to "2027-01-29"
    And the project has a task "Elaborar plan de pruebas"
    And a team member is registered
    And the team member is signed in

  @US63
  Scenario: The member is notified when a task is assigned to them
    When I assign the task to the team member
    Then the team member should receive a "TASK_ASSIGNED" notification
    And the bell of the team member should show 1 unread notification with the red dot

  @US63 @US14
  Scenario: The member is notified when they are allocated to a project
    When I allocate the team member as "QA" with 30 percent from "2026-11-09" to "2026-12-18"
    Then the team member should receive a "MEMBER_ALLOCATED" notification

  @US63
  Scenario: Reading the notification turns off the red dot
    Given the task was assigned to the team member and the member was notified
    When the team member marks the notification as read
    Then the response status should be 200
    And the response field "read" should be "true"
    And the bell of the team member should show 0 unread notification without the red dot

  @US63
  Scenario: A user cannot read the notifications of another user
    Given the task was assigned to the team member and the member was notified
    When I mark the notification of the team member as read
    Then the response status should be 404
