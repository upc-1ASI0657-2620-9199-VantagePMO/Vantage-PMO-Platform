const { Then } = require('@cucumber/cucumber');
const assert = require('assert');

Then('the response status should be {int}', function (status) {
  assert.strictEqual(this.response.status, status, `Unexpected body: ${JSON.stringify(this.body)}`);
});

Then('the response should contain the field {string}', function (field) {
  assert.ok(this.body && this.body[field] !== undefined && this.body[field] !== null, `Field ${field} missing`);
});

Then('the response should not contain the field {string}', function (field) {
  assert.ok(!(field in this.body), `Field ${field} must not be exposed`);
});

Then('the response field {string} should be {string}', function (field, value) {
  assert.strictEqual(String(this.body[field]), value);
});

Then('the response field {string} should be {int}', function (field, value) {
  assert.strictEqual(Number(this.body[field]), value);
});

Then('the error detail should be {string}', function (detail) {
  assert.strictEqual(this.body.detail, detail);
});
