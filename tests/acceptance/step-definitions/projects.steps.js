const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

When('I create a project with:', async function (table) {
  const data = table.rowsHash();
  await this.call('POST', '/api/v1/projects', { ...data, budget: Number(data.budget) });
  if (this.response.status === 201) this.project = this.body;
});

Given('a project from {string} to {string}', async function (start, end) {
  await this.createProject(start, end);
});

Then('the project status should be {string}', function (status) {
  assert.strictEqual(this.body.status, status);
});

When('I add the milestone {string} due on {string}', async function (name, dueDate) {
  await this.call('POST', `/api/v1/projects/${this.project.id}/milestones`, { name, dueDate });
});

Given('the project has {int} tasks of which {int} are completed', async function (total, completed) {
  for (let i = 0; i < total; i++) {
    const task = await this.createTask(`Tarea ${i + 1}`);
    if (i < completed) await this.call('PATCH', `/api/v1/tasks/${task.id}/completion`, { completed: true });
  }
});

When('I request the portfolio filtered by the project client', async function () {
  await this.call('GET', `/api/v1/projects?client=${encodeURIComponent(this.project.client)}`);
});

Then('the portfolio should contain the project with {int} tasks, {int} completed and {int} percent progress', function (total, completed, pct) {
  const item = this.body.items.find((p) => p.id === this.project.id);
  assert.ok(item, 'Project not found in portfolio');
  assert.strictEqual(item.totalTasks, total);
  assert.strictEqual(item.completedTasks, completed);
  assert.strictEqual(item.progressPercentage, pct);
});

Given('{int} projects exist for the same client', async function (count) {
  const client = this.uniqueClient();
  this.sharedClient = client;
  for (let i = 0; i < count; i++) {
    await this.call('POST', '/api/v1/projects', { name: `Proyecto ${i + 1}`, client, startDate: '2026-10-12', endDate: '2026-12-31', budget: 1000 });
    assert.strictEqual(this.response.status, 201);
  }
});

When('I request page {int} of size {int} of the portfolio filtered by that client', async function (page, size) {
  await this.call('GET', `/api/v1/projects?page=${page}&size=${size}&client=${encodeURIComponent(this.sharedClient)}`);
});

Then('the page should contain {int} items out of {int} in {int} pages', function (items, total, pages) {
  assert.strictEqual(this.body.items.length, items);
  assert.strictEqual(this.body.totalItems, total);
  assert.strictEqual(this.body.totalPages, pages);
});

When('I change the project status to {string}', async function (status) {
  await this.call('PATCH', `/api/v1/projects/${this.project.id}/status`, { status });
});

Then('the project client and budget should remain unchanged', function () {
  assert.strictEqual(this.body.client, this.project.client);
  assert.strictEqual(this.body.budget, this.project.budget);
});
