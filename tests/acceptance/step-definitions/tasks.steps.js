const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

Given('the project has a task {string}', async function (title) {
  this.task = await this.createTask(title);
});

When('I assign the task to the team member', async function () {
  await this.call('PATCH', `/api/v1/tasks/${this.task.id}/assignee`, { memberId: this.member.id });
});

Then('the task should be assigned to the team member', function () {
  assert.strictEqual(this.body.assignedTo, this.member.id);
});

Then('the task status should be {string}', function (status) {
  assert.strictEqual(this.body.status, status);
});

Given('the task is marked as completed', async function () {
  await this.call('PATCH', `/api/v1/tasks/${this.task.id}/completion`, { completed: true });
  assert.strictEqual(this.response.status, 200);
});

When('I set the task completion to {word}', async function (value) {
  await this.call('PATCH', `/api/v1/tasks/${this.task.id}/completion`, { completed: value === 'true' });
});
