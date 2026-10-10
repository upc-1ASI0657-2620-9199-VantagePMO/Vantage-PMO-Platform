@IAM
Feature: User authentication
  As a Vantage PMO user
  I want to register and sign in with my credentials
  So that my project information is protected

  @US51
  Scenario: A new user is registered with a hashed password
    When a visitor signs up as "Renzo Araos" with a unique e-mail and password "Vantage2026"
    Then the response status should be 201
    And the response should contain the field "id"
    And the response should not contain the field "password"
    And the response should not contain the field "passwordHash"

  @US51
  Scenario: A weak password is rejected
    When a visitor signs up as "Renzo Araos" with a unique e-mail and password "123"
    Then the response status should be 400

  @US20 @US41
  Scenario: A registered user signs in and receives a JWT
    Given a registered user with password "Vantage2026"
    When the user signs in with password "Vantage2026"
    Then the response status should be 200
    And the response should contain a signed JWT valid for 3600 seconds

  @US20
  Scenario: Sign-in fails with a wrong password
    Given a registered user with password "Vantage2026"
    When the user signs in with password "WrongPass2026"
    Then the response status should be 401
    And the error detail should be "Invalid email or password."

  @US41
  Scenario Outline: Protected endpoints require a valid token
    When a client calls GET "<endpoint>" with <credentials>
    Then the response status should be 401

    Examples:
      | endpoint          | credentials      |
      | /api/v1/projects  | no token         |
      | /api/v1/users/me  | no token         |
      | /api/v1/projects  | a tampered token |
