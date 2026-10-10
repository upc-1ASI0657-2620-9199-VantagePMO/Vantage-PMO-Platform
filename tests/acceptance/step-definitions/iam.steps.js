const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

When('a visitor signs up as {string} with a unique e-mail and password {string}', async function (name, password) {
  await this.signUp(name, this.uniqueEmail('signup'), password);
});

Given('a registered user with password {string}', async function (password) {
  this.credentials = { email: this.uniqueEmail('signin'), password };
  await this.signUp('Usuario Registrado', this.credentials.email, password, 'PROJECT_MANAGER');
  assert.strictEqual(this.response.status, 201);
});

When('the user signs in with password {string}', async function (password) {
  await this.signIn(this.credentials.email, password);
});

Then('the response should contain a signed JWT valid for {int} seconds', function (seconds) {
  const parts = this.body.token.split('.');
  assert.strictEqual(parts.length, 3, 'A JWT has header, payload and signature');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  assert.strictEqual(payload.sub, this.body.id);
  assert.strictEqual(payload.exp - payload.iat, seconds);
  assert.strictEqual(this.body.expiresIn, seconds);
});

When('a client calls GET {string} with no token', async function (endpoint) {
  await this.call('GET', endpoint, undefined, null);
});

When('a client calls GET {string} with a tampered token', async function (endpoint) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: 'attacker', role: 'ADMIN' })).toString('base64url');
  await this.call('GET', endpoint, undefined, `${header}.${payload}.forged-signature`);
});

Given('I am signed in as a {string}', async function (role) {
  const email = this.uniqueEmail(role.toLowerCase());
  await this.signUp(`Usuario ${role}`, email, 'Vantage2026', role);
  assert.strictEqual(this.response.status, 201, JSON.stringify(this.body));
  await this.signIn(email, 'Vantage2026');
  this.token = this.body.token;
});

Given('a team member is registered', async function () {
  this.member = await this.signUp('Miembro del Equipo', this.uniqueEmail('member'), 'Vantage2026', 'MEMBER');
  assert.strictEqual(this.response.status, 201);
});
