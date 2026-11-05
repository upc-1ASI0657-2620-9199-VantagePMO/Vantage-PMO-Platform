const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

/** Resource Service learns about users and projects through events: wait until it knows them. */
async function allocate(world, projectId, body) {
  await world.eventually(async () => {
    await world.call('POST', `/api/v1/projects/${projectId}/allocations`, body);
    assert.notStrictEqual(world.response.status, 404, 'member or project not synchronized yet');
  });
  if (world.response.status === 201) world.allocation = world.body;
}

When('I allocate the team member as {string} with {int} percent from {string} to {string}', async function (role, percentage, startDate, endDate) {
  await allocate(this, this.project.id, { memberId: this.member.id, role, percentage, startDate, endDate });
});

Given('the team member is allocated with {int} percent from {string} to {string}', async function (percentage, startDate, endDate) {
  await allocate(this, this.project.id, { memberId: this.member.id, role: 'Analista', percentage, startDate, endDate });
  assert.strictEqual(this.response.status, 201, JSON.stringify(this.body));
});

Given('a second project from {string} to {string}', async function (start, end) {
  this.firstProject = this.project;
  this.secondProject = await this.createProject(start, end);
  this.project = this.firstProject;
});

When('I allocate the team member to the second project with {int} percent from {string} to {string}', async function (percentage, startDate, endDate) {
  await allocate(this, this.secondProject.id, { memberId: this.member.id, role: 'Desarrollador', percentage, startDate, endDate });
});

Then('the project team should include the team member with {int} percent', async function (percentage) {
  await this.call('GET', `/api/v1/projects/${this.project.id}/allocations`);
  const item = this.body.find((a) => a.memberId === this.member.id);
  assert.ok(item, 'member not in the project team');
  assert.strictEqual(item.percentage, percentage);
  assert.strictEqual(item.memberName, 'Miembro del Equipo');
});

When('I release the allocation', async function () {
  await this.call('DELETE', `/api/v1/allocations/${this.allocation.id}`);
});

Then('the project team should be empty', async function () {
  await this.call('GET', `/api/v1/projects/${this.project.id}/allocations`);
  assert.deepStrictEqual(this.body, []);
});

When('I request the resource availability from {string} to {string}', async function (from, to) {
  await this.call('GET', `/api/v1/resources/availability?from=${from}&to=${to}`);
});

When('I request the resource availability from {string} to {string} with at least {int} percent available', async function (from, to, min) {
  await this.call('GET', `/api/v1/resources/availability?from=${from}&to=${to}&minAvailable=${min}`);
});

Then('the team member should appear with {int} percent allocated, {int} percent available and status {string}', function (allocated, available, status) {
  const m = this.body.members.find((x) => x.memberId === this.member.id);
  assert.ok(m, 'member not in the availability list');
  assert.strictEqual(m.allocatedPercentage, allocated);
  assert.strictEqual(m.availablePercentage, available);
  assert.strictEqual(m.status, status);
});

Then('the team member should not appear in the availability list', function () {
  assert.ok(!this.body.members.some((x) => x.memberId === this.member.id));
});
