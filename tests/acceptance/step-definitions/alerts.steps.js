const { When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

When('the alert scan runs at {string}', async function (asOf) {
  await this.call('POST', '/api/v1/alerts/scan', { asOf });
  this.scan = this.body;
});

When('the alert scan runs {int} hours from now', async function (hours) {
  await this.call('POST', '/api/v1/alerts/scan', { asOf: new Date(Date.now() + hours * 3_600_000).toISOString() });
  this.scan = this.body;
});

Then('the scan should report a {string} event for the project', function (type) {
  assert.ok(this.scan.events.some((e) => e.type === type && e.projectId === this.project.id), JSON.stringify(this.scan));
});

Then('the scan should not report a {string} event for the project', function (type) {
  assert.ok(!this.scan.events.some((e) => e.type === type && e.projectId === this.project.id));
});
