@Document @ProjectTask
Feature: Mandatory documents of a milestone
  As a PMO Lead
  I want to mark which documents are mandatory for a milestone
  So that a milestone cannot be closed without them

  Background:
    Given I am signed in as a "PMO_LEAD"
    And a project from "2026-11-02" to "2027-01-29"
    And I add the milestone "Go-live del módulo de inventario" due on "2026-12-15"

  @US21
  Scenario: Mark a document as mandatory for a milestone
    When I mark the document "Acta de aceptación del cliente" as mandatory for the milestone
    Then the response status should be 201
    And the milestone should list "Acta de aceptación del cliente" as missing

  @US22 @US49
  Scenario: A milestone cannot be completed while a mandatory document is missing
    Given the document "Acta de aceptación del cliente" is mandatory for the milestone
    When I try to complete the milestone
    Then the response status should be 422
    And the response field "type" should be "milestone-documents-missing"

  @US22 @US49
  Scenario: The milestone can be completed once the mandatory document is uploaded
    Given the document "Acta de aceptación del cliente" is mandatory for the milestone
    When I upload the file "acta-firmada.pdf" with content "Acta firmada" for the mandatory document
    And I try to complete the milestone
    Then the response status should be 200
    And the response field "status" should be "COMPLETED"

  @US21
  Scenario: A member cannot define mandatory documents
    Given I am signed in as a "MEMBER"
    When I mark the document "Acta de aceptación del cliente" as mandatory for the milestone
    Then the response status should be 403
