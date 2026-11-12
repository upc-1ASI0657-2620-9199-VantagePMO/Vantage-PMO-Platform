const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

/** Document Service learns about projects and milestones through events: retry while they are unknown. */
async function upload(world, fileName, contentType, content, fields) {
  await world.eventually(async () => {
    await world.upload(`/api/v1/projects/${world.project.id}/documents`, fileName, contentType, content, fields);
    assert.notStrictEqual(world.response.status, 404, 'project not synchronized yet');
  });
  if (world.response.status === 201) world.document = world.body;
}

When('I upload the file {string} with content {string} to the task', async function (fileName, content) {
  await upload(this, fileName, 'application/pdf', content, { taskId: this.task.id });
});

Given('the file {string} with content {string} was uploaded to the task', async function (fileName, content) {
  await upload(this, fileName, 'application/pdf', content, { taskId: this.task.id });
  assert.strictEqual(this.response.status, 201, JSON.stringify(this.body));
});

When('I upload the file {string} of type {string} with content {string} to the task', async function (fileName, type, content) {
  await upload(this, fileName, type, content, { taskId: this.task.id });
});

async function download(world, version) {
  const query = version ? `?version=${version}` : '';
  const res = await fetch(`${world.baseUrl}/api/v1/documents/${world.document.id}/content${query}`, { headers: { Authorization: `Bearer ${world.token}` } });
  assert.strictEqual(res.status, 200);
  return res.text();
}

Then('the document should be downloadable with content {string}', async function (content) {
  assert.ok(this.document.downloadUrl.endsWith(`/api/v1/documents/${this.document.id}/content`));
  assert.strictEqual(await download(this), content);
});

Then('version {int} of the document should still be downloadable with content {string}', async function (version, content) {
  assert.strictEqual(await download(this, version), content);
});

async function defineRequirement(world, name) {
  await world.eventually(async () => {
    await world.call('POST', `/api/v1/projects/${world.project.id}/milestones/${world.milestone.id}/document-requirements`, { name });
    assert.notStrictEqual(world.response.status, 404, 'milestone not synchronized yet');
  });
  if (world.response.status === 201) world.requirement = world.body;
}

When('I mark the document {string} as mandatory for the milestone', async function (name) {
  await defineRequirement(this, name);
});

Given('the document {string} is mandatory for the milestone', async function (name) {
  await defineRequirement(this, name);
  assert.strictEqual(this.response.status, 201, JSON.stringify(this.body));
  // Project & Task receives the requirement through documents.requirement-defined
  await new Promise((r) => setTimeout(r, 1500));
});

Then('the milestone should list {string} as missing', async function (name) {
  await this.call('GET', `/api/v1/projects/${this.project.id}/milestones/${this.milestone.id}/document-requirements`);
  assert.strictEqual(this.body.readyToClose, false);
  assert.deepStrictEqual(this.body.missing, [name]);
});

When('I upload the file {string} with content {string} for the mandatory document', async function (fileName, content) {
  await upload(this, fileName, 'application/pdf', content, { requirementId: this.requirement.id });
  assert.strictEqual(this.response.status, 201, JSON.stringify(this.body));
  assert.strictEqual(this.body.fulfilledRequirementId, this.requirement.id);
  await new Promise((r) => setTimeout(r, 1500));
});

When('I try to complete the milestone', async function () {
  await this.call('PATCH', `/api/v1/projects/${this.project.id}/milestones/${this.milestone.id}/completion`);
});
