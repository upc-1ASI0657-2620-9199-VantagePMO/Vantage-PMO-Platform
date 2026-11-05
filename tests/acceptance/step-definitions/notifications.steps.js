const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

async function notificationsOf(world, token) {
  await world.call('GET', '/api/v1/notifications?size=100', undefined, token);
  assert.strictEqual(world.response.status, 200);
  return world.body.items;
}

async function waitForNotification(world, token, type, predicate = () => true) {
  return world.eventually(async () => {
    const found = (await notificationsOf(world, token)).filter((n) => n.type === type && predicate(n));
    assert.ok(found.length > 0, `no ${type} notification yet`);
    return found;
  });
}

const aboutProject = (world) => (n) => n.link === `/projects/${world.project.id}`;

Then('the team member should receive a {string} notification', async function (type) {
  [this.notification] = await waitForNotification(this, this.memberToken, type);
});

Given('the task was assigned to the team member and the member was notified', async function () {
  await this.call('PATCH', `/api/v1/tasks/${this.task.id}/assignee`, { memberId: this.member.id });
  assert.strictEqual(this.response.status, 200);
  [this.notification] = await waitForNotification(this, this.memberToken, 'TASK_ASSIGNED');
});

Then('the bell of the team member should show {int} unread notification with the red dot', async function (count) {
  await this.call('GET', '/api/v1/notifications/unread-count', undefined, this.memberToken);
  assert.strictEqual(this.body.unread, count);
  assert.strictEqual(this.body.hasUnread, true);
});

Then('the bell of the team member should show {int} unread notification without the red dot', async function (count) {
  await this.call('GET', '/api/v1/notifications/unread-count', undefined, this.memberToken);
  assert.strictEqual(this.body.unread, count);
  assert.strictEqual(this.body.hasUnread, false);
});

When('the team member marks the notification as read', async function () {
  await this.call('PATCH', `/api/v1/notifications/${this.notification.id}/read`, undefined, this.memberToken);
});

When('I mark the notification of the team member as read', async function () {
  await this.call('PATCH', `/api/v1/notifications/${this.notification.id}/read`);
});

Then('I should receive a {string} notification about the project', async function (type) {
  await waitForNotification(this, this.token, type, aboutProject(this));
});

Then('I should have exactly {int} {string} notification about the project', async function (count, type) {
  await waitForNotification(this, this.token, type, aboutProject(this));
  await new Promise((r) => setTimeout(r, 1500)); // leave time for a possible duplicate
  const found = (await notificationsOf(this, this.token)).filter((n) => n.type === type && aboutProject(this)(n));
  assert.strictEqual(found.length, count);
});
