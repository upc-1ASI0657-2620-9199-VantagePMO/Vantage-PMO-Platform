@Risk
Feature: Risk register
  As a PMO
  I want to register project risks and evaluate them
  So that I can mitigate them in time

  Background:
    Given I am signed in as a "PROJECT_MANAGER"
    And a project from "2026-11-02" to "2027-01-29"

  @US28
  Scenario Outline: The severity is calculated from probability and impact
    When I register the risk "<title>" with probability <probability> and impact <impact>
    Then the response status should be 201
    And the response field "score" should be <score>
    And the response field "level" should be "<level>"

    Examples:
      | title                         | probability | impact | score | level    |
      | Cambio de alcance del cliente | 1           | 3      | 3     | LOW      |
      | Rotación del analista         | 2           | 4      | 8     | MEDIUM   |
      | Retraso en integración        | 3           | 4      | 12    | HIGH     |
      | Proveedor RFID sin stock      | 4           | 5      | 20    | CRITICAL |

  @US29
  Scenario: Mitigating a risk lowers its severity and keeps the history
    Given the risk "Proveedor RFID sin stock" with probability 4 and impact 5 is registered
    When I start mitigating the risk with the plan "Cotizar un segundo proveedor"
    And I re-evaluate the risk with probability 2 and impact 4
    Then the response status should be 200
    And the response field "level" should be "MEDIUM"
    And the risk history should show scores 20, 8

  @US29
  Scenario: A risk cannot start mitigation without a plan
    Given the risk "Proveedor RFID sin stock" with probability 4 and impact 5 is registered
    When I change the risk status to "MITIGATING" without a plan
    Then the response status should be 422
    And the response field "type" should be "mitigation-plan-required"

  @US28
  Scenario: Probability and impact must be between 1 and 5
    When I register the risk "Fuera de escala" with probability 6 and impact 2
    Then the response status should be 400
