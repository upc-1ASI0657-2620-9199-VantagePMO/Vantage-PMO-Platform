@Risk @Notification
Feature: Risk prioritization
  As a manager
  I want to see the most severe risks first and the critical ones highlighted
  So that I can prioritize immediate actions

  Background:
    Given I am signed in as a "PMO_LEAD"
    And a project from "2026-11-02" to "2027-01-29"
    And the risk "Cambio de alcance del cliente" with probability 1 and impact 3 is registered
    And the risk "Proveedor RFID sin stock" with probability 4 and impact 5 is registered
    And the risk "Retraso en integración" with probability 3 and impact 4 is registered

  @US55
  Scenario: The project risks are ordered by severity
    When I request the risks of the project
    Then the response status should be 200
    And the risks should be ordered "Proveedor RFID sin stock", "Retraso en integración", "Cambio de alcance del cliente"
    And only "Proveedor RFID sin stock" should be highlighted

  @US30
  Scenario: The priority view shows the open high and critical risks of the portfolio
    When I request the priority risks of the portfolio
    Then the response status should be 200
    And the priority view should include "Proveedor RFID sin stock" and "Retraso en integración" of the project
    And the priority view should not include "Cambio de alcance del cliente"

  @US30 @US63
  Scenario: The project owner is notified of a critical risk
    Then I should receive a "CRITICAL_RISK" notification about the risks of the project
