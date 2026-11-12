const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

async function register(world, title, probability, impact) {
  await world.eventually(async () => {
    await world.call('POST', `/api/v1/projects/${world.project.id}/risks`, { title, category: 'TECHNICAL', probability, impact });
    assert.notStrictEqual(world.response.status, 404, 'project not synchronized yet');
  });
  if (world.response.status === 201) world.risk = world.body;
}

When('I register the risk {string} with probability {int} and impact {int}', async function (title, p, i) {
  await register(this, title, p, i);
});

Given('the risk {string} with probability {int} and impact {int} is registered', async function (title, p, i) {
  await register(this, title, p, i);
  assert.strictEqual(this.response.status, 201, JSON.stringify(this.body));
});

When('I start mitigating the risk with the plan {string}', async function (plan) {
  await this.call('PATCH', `/api/v1/risks/${this.risk.id}/status`, { status: 'MITIGATING', mitigationPlan: plan });
  assert.strictEqual(this.response.status, 200, JSON.stringify(this.body));
});

When('I change the risk status to {string} without a plan', async function (status) {
  await this.call('PATCH', `/api/v1/risks/${this.risk.id}/status`, { status });
});

When('I re-evaluate the risk with probability {int} and impact {int}', async function (probability, impact) {
  await this.call('POST', `/api/v1/risks/${this.risk.id}/assessments`, { probability, impact, note: 'Reevaluación tras la mitigación' });
});

Then('the risk history should show scores {int}, {int}', function (a, b) {
  assert.deepStrictEqual(this.body.assessments.map((x) => x.score), [a, b]);
});

When('I request the risks of the project', async function () {
  await this.call('GET', `/api/v1/projects/${this.project.id}/risks`);
});

Then('the risks should be ordered {string}, {string}, {string}', function (a, b, c) {
  assert.deepStrictEqual(this.body.map((r) => r.title), [a, b, c]);
});

Then('only {string} should be highlighted', function (title) {
  assert.deepStrictEqual(this.body.filter((r) => r.highlighted).map((r) => r.title), [title]);
});

When('I request the priority risks of the portfolio', async function () {
  await this.call('GET', '/api/v1/risks/priority');
});

const ofProject = (world) => world.body.filter((r) => r.projectId === world.project.id).map((r) => r.title);

Then('the priority view should include {string} and {string} of the project', function (a, b) {
  assert.deepStrictEqual(ofProject(this), [a, b]);
});

Then('the priority view should not include {string}', function (title) {
  assert.ok(!ofProject(this).includes(title));
});

Then('I should receive a {string} notification about the risks of the project', async function (type) {
  await this.eventually(async () => {
    await this.call('GET', '/api/v1/notifications?size=100');
    assert.ok(this.body.items.some((n) => n.type === type && n.link === `/projects/${this.project.id}/risks`), `no ${type} notification yet`);
  });
});
