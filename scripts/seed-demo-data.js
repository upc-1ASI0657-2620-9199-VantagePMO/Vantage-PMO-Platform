/**
 * Loads demo data through the API Gateway (used for the Sprint Review and the execution evidence).
 * Usage: BASE_URL=http://localhost:3000 node scripts/seed-demo-data.js
 */
const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const PASSWORD = 'Vantage2026';

async function call(method, path, body, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok && res.status !== 409) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  const team = [
    { fullName: 'Mike Dylan Guillen Giraldo', email: 'mike.guillen@vantagepmo.pe', role: 'PMO_LEAD' },
    { fullName: 'Carlo Patricio Ramirez Escalante', email: 'carlo.ramirez@vantagepmo.pe', role: 'PROJECT_MANAGER' },
    { fullName: 'David Vivar', email: 'david.vivar@vantagepmo.pe', role: 'PROJECT_MANAGER' },
    { fullName: 'Katherine Herrera', email: 'katherine.herrera@vantagepmo.pe', role: 'MEMBER' },
  ];
  for (const m of team) await call('POST', '/api/v1/authentication/sign-up', { ...m, password: PASSWORD });
  const { token } = await call('POST', '/api/v1/authentication/sign-in', { email: team[0].email, password: PASSWORD });
  const users = await call('GET', '/api/v1/users', null, token);
  const byEmail = Object.fromEntries(users.map((u) => [u.email, u.id]));

  const projects = [
    {
      data: { name: 'Implementación ERP Logística', client: 'Transportes Andinos S.A.C.', startDate: '2026-09-07', endDate: '2027-01-29', budget: 85000 },
      status: ['IN_PROGRESS'],
      milestones: [['Levantamiento de procesos', '2026-10-12'], ['Go-live módulo de inventario', '2026-12-15']],
      tasks: [
        ['Mapear procesos de almacén', 'HIGH', 'david.vivar@vantagepmo.pe', true],
        ['Diseñar modelo de datos de inventario', 'HIGH', 'carlo.ramirez@vantagepmo.pe', true],
        ['Configurar ambiente de pruebas', 'MEDIUM', 'katherine.herrera@vantagepmo.pe', false],
        ['Capacitar a supervisores de turno', 'LOW', null, false],
      ],
    },
    {
      data: { name: 'Portal de Autoservicio de Clientes', client: 'Banco Pacífico Sur', startDate: '2026-10-01', endDate: '2027-03-31', budget: 142500 },
      status: ['IN_PROGRESS'],
      milestones: [['Prototipo validado', '2026-11-20']],
      tasks: [
        ['Entrevistas con usuarios clave', 'HIGH', 'mike.guillen@vantagepmo.pe', true],
        ['Prototipo de alta fidelidad', 'MEDIUM', 'david.vivar@vantagepmo.pe', false],
        ['Integración con core bancario', 'CRITICAL', 'carlo.ramirez@vantagepmo.pe', false],
      ],
    },
    {
      data: { name: 'Migración de Infraestructura a la Nube', client: 'Clínica San Gabriel', startDate: '2026-08-03', endDate: '2026-11-27', budget: 60000 },
      status: ['IN_PROGRESS', 'ON_HOLD'],
      milestones: [['Migración de base de datos', '2026-10-30']],
      tasks: [
        ['Inventario de servidores', 'MEDIUM', 'katherine.herrera@vantagepmo.pe', true],
        ['Plan de rollback', 'HIGH', 'carlo.ramirez@vantagepmo.pe', true],
        ['Migrar servidor de historias clínicas', 'CRITICAL', null, false],
      ],
    },
    {
      data: { name: 'Tablero de Indicadores Comerciales', client: 'Distribuidora Norte E.I.R.L.', startDate: '2026-11-02', endDate: '2027-02-12', budget: 28000 },
      status: [],
      milestones: [],
      tasks: [['Definir KPIs con gerencia comercial', 'MEDIUM', null, false]],
    },
  ];

  for (const p of projects) {
    const project = await call('POST', '/api/v1/projects', p.data, token);
    for (const [name, dueDate] of p.milestones) await call('POST', `/api/v1/projects/${project.id}/milestones`, { name, dueDate }, token);
    for (const [title, priority, assignee, done] of p.tasks) {
      const task = await call('POST', `/api/v1/projects/${project.id}/tasks`, { title, priority }, token);
      if (assignee) await call('PATCH', `/api/v1/tasks/${task.id}/assignee`, { memberId: byEmail[assignee] }, token);
      if (done) await call('PATCH', `/api/v1/tasks/${task.id}/completion`, { completed: true }, token);
    }
    for (const status of p.status) await call('PATCH', `/api/v1/projects/${project.id}/status`, { status }, token);
  }
  console.log(`Demo data loaded: ${team.length} users, ${projects.length} projects. Sign in with ${team[0].email} / ${PASSWORD}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
