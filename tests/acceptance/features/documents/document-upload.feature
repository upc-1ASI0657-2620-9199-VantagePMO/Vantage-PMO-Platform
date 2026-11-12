@Document
Feature: Project documents
  As a team member
  I want to attach files to tasks and keep their versions
  So that the project information is centralized and no revision is lost

  Background:
    Given I am signed in as a "PROJECT_MANAGER"
    And a project from "2026-11-02" to "2027-01-29"
    And the project has a task "Elaborar plan de pruebas"

  @US45 @US05
  Scenario: Upload a file to a task and get its access URL
    When I upload the file "plan-de-pruebas.pdf" with content "Plan v1" to the task
    Then the response status should be 201
    And the response field "latestVersion" should be 1
    And the response field "createdNewDocument" should be "true"
    And the document should be downloadable with content "Plan v1"

  @US35
  Scenario: Uploading a document with the same name creates a new version
    Given the file "plan-de-pruebas.pdf" with content "Plan v1" was uploaded to the task
    When I upload the file "plan-de-pruebas.pdf" with content "Plan v2 corregido" to the task
    Then the response status should be 201
    And the response field "latestVersion" should be 2
    And the response field "createdNewDocument" should be "false"
    And version 1 of the document should still be downloadable with content "Plan v1"

  @US35
  Scenario: Uploading exactly the same content again is rejected
    Given the file "plan-de-pruebas.pdf" with content "Plan v1" was uploaded to the task
    When I upload the file "plan-de-pruebas.pdf" with content "Plan v1" to the task
    Then the response status should be 409
    And the response field "type" should be "duplicate-document-content"

  @US45
  Scenario: Files of a type that is not allowed are rejected
    When I upload the file "script.exe" of type "application/x-msdownload" with content "MZ" to the task
    Then the response status should be 422
    And the response field "type" should be "file-type-not-allowed"

  @US45
  Scenario: Empty optional form fields are ignored
    When I upload the file "minuta.pdf" with content "Minuta de reunión" leaving the optional fields empty
    Then the response status should be 201
    And the response field "taskId" should be "null"
