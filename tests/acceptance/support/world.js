const { setWorldConstructor, setDefaultTimeout } = require('@cucumber/cucumber');
const { randomUUID } = require('crypto');

setDefaultTimeout(20 * 1000);

/** Shared state of a scenario. All calls go through the API Gateway (BASE_URL). */
class VantageWorld {
  constructor() {
    this.baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    this.token = null;
    this.response = null;
    this.body = null;
    this.project = null;
    this.task = null;
    this.member = null;
    this.credentials = null;
  }

  uniqueEmail(prefix = 'user') {
    return `${prefix}.${randomUUID().slice(0, 8)}@acceptance.vantagepmo.pe`;
  }

  uniqueClient() {
    return `Cliente Acceptance ${randomUUID().slice(0, 8)}`;
  }

  async call(method, path, body, token = this.token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    this.response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await this.response.text();
    this.body = text ? JSON.parse(text) : null;
    return this.body;
  }

  async signUp(fullName, email, password, role = 'MEMBER') {
    return this.call('POST', '/api/v1/authentication/sign-up', { fullName, email, password, role }, null);
  }

  async signIn(email, password) {
    return this.call('POST', '/api/v1/authentication/sign-in', { email, password }, null);
  }

  async createProject(startDate, endDate) {
    const project = await this.call('POST', '/api/v1/projects', {
      name: 'Proyecto de aceptación',
      client: this.uniqueClient(),
      startDate,
      endDate,
      budget: 50000,
    });
    if (this.response.status !== 201) throw new Error(`Project creation failed: ${JSON.stringify(project)}`);
    this.project = project;
    return project;
  }

  async createTask(title) {
    const task = await this.call('POST', `/api/v1/projects/${this.project.id}/tasks`, { title });
    if (this.response.status !== 201) throw new Error(`Task creation failed: ${JSON.stringify(task)}`);
    return task;
  }
}

setWorldConstructor(VantageWorld);
