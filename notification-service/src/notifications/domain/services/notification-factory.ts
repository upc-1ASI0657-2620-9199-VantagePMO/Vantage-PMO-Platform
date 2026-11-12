import { DomainEvent } from '@vantage-pmo/event-bus';
import { Notification } from '../model/aggregates/notification';
import { NotificationType } from '../model/value-objects/notification-type';

/** Events this context listens to (published language of the other bounded contexts). */
export const SUBSCRIBED_EVENTS = [
  'projects.milestone-due-soon',
  'projects.project-stalled',
  'projects.task-assigned',
  'resources.member-allocated',
  'resources.member-overallocated',
  'risks.critical-risk-identified',
] as const;

const formatDate = (iso: string) => {
  const [y, m, d] = iso.substring(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

/**
 * Domain service (Anti-Corruption Layer): translates the events of other contexts into the
 * notifications of this one. It is pure, so it is unit tested without infrastructure.
 */
export class NotificationFactory {
  static fromEvent(event: DomainEvent): Notification[] {
    const p = event.payload as Record<string, any>;
    const key = event.key;
    switch (event.type) {
      case 'projects.milestone-due-soon':
        return [Notification.create({
          recipientId: p.ownerId, type: NotificationType.MILESTONE_DUE_SOON, eventKey: key,
          title: `El hito "${p.milestoneName}" vence pronto`,
          message: `El hito "${p.milestoneName}" del proyecto ${p.projectName} vence el ${formatDate(p.dueDate)} (menos de 24 horas).`,
          link: `/projects/${p.projectId}`,
        })];
      case 'projects.project-stalled':
        return [Notification.create({
          recipientId: p.ownerId, type: NotificationType.PROJECT_STALLED, eventKey: key,
          title: `El proyecto ${p.projectName} no tiene avances`,
          message: `El proyecto ${p.projectName} lleva ${p.inactiveHours} horas sin cambios. Revisa su estado con el equipo.`,
          link: `/projects/${p.projectId}`,
        })];
      case 'projects.task-assigned':
        return [Notification.create({
          recipientId: p.assigneeId, type: NotificationType.TASK_ASSIGNED, eventKey: key,
          title: 'Tienes una nueva tarea',
          message: `Se te asignó la tarea "${p.title}" del proyecto ${p.projectName}${p.dueDate ? `, con fecha límite ${formatDate(p.dueDate)}` : ''}.`,
          link: `/tasks/${p.taskId}`,
        })];
      case 'resources.member-allocated':
        return [Notification.create({
          recipientId: p.memberId, type: NotificationType.MEMBER_ALLOCATED, eventKey: key,
          title: `Te asignaron al proyecto ${p.projectName}`,
          message: `Participarás como ${p.role} con ${p.percentage} % de tu tiempo, del ${formatDate(p.startDate)} al ${formatDate(p.endDate)}.`,
          link: `/projects/${p.projectId}`,
        })];
      case 'resources.member-overallocated':
        if (!p.ownerId) return [];
        return [Notification.create({
          recipientId: p.ownerId, type: NotificationType.MEMBER_OVERALLOCATED, eventKey: key,
          title: `${p.memberName} está sobreasignado`,
          message: `${p.memberName} suma ${p.totalAllocation} % de carga entre el ${formatDate(p.startDate)} y el ${formatDate(p.endDate)} tras su asignación a ${p.projectName}.`,
          link: `/resources/availability`,
        })];
      case 'risks.critical-risk-identified': {
        const recipients = [...new Set([p.ownerId, p.responsibleId].filter(Boolean))] as string[];
        return recipients.map((recipientId) => Notification.create({
          recipientId, type: NotificationType.CRITICAL_RISK, eventKey: key,
          title: `Riesgo crítico en ${p.projectName}`,
          message: `"${p.title}" tiene severidad ${p.score} (probabilidad ${p.probability} × impacto ${p.impact}). Revisa su plan de mitigación.`,
          link: `/projects/${p.projectId}/risks`,
        }));
      }
      default:
        return [];
    }
  }
}
