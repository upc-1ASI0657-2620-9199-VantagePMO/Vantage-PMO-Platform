import { ProjectAlertPolicy } from '../../src/projects/domain/services/project-alert-policy';

describe('ProjectAlertPolicy', () => {
  const asOf = new Date('2026-11-08T12:00:00Z');

  describe('milestone due soon (US09)', () => {
    it('alerts a pending milestone that expires within the next 24 hours', () => {
      expect(ProjectAlertPolicy.isMilestoneDueSoon('2026-11-08', 'PENDING', asOf)).toBe(true);
      expect(ProjectAlertPolicy.isMilestoneDueSoon('2026-11-09', 'PENDING', new Date('2026-11-09T00:30:00Z'))).toBe(true);
    });

    it('does not alert milestones further than 24 hours away, already expired or completed', () => {
      expect(ProjectAlertPolicy.isMilestoneDueSoon('2026-11-10', 'PENDING', asOf)).toBe(false);
      expect(ProjectAlertPolicy.isMilestoneDueSoon('2026-11-07', 'PENDING', asOf)).toBe(false);
      expect(ProjectAlertPolicy.isMilestoneDueSoon('2026-11-08', 'COMPLETED', asOf)).toBe(false);
    });
  });

  describe('stalled project (US10, US53)', () => {
    it('flags an open project with 72 hours or more without changes', () => {
      expect(ProjectAlertPolicy.isProjectStalled('IN_PROGRESS', new Date('2026-11-05T12:00:00Z'), asOf)).toBe(true);
      expect(ProjectAlertPolicy.isProjectStalled('PLANNED', new Date('2026-11-01T00:00:00Z'), asOf)).toBe(true);
    });

    it('ignores recent activity and closed or paused projects', () => {
      expect(ProjectAlertPolicy.isProjectStalled('IN_PROGRESS', new Date('2026-11-05T13:00:00Z'), asOf)).toBe(false);
      expect(ProjectAlertPolicy.isProjectStalled('COMPLETED', new Date('2026-10-01T00:00:00Z'), asOf)).toBe(false);
      expect(ProjectAlertPolicy.isProjectStalled('ON_HOLD', new Date('2026-10-01T00:00:00Z'), asOf)).toBe(false);
    });
  });

  it('builds stable keys so the same fact is notified only once', () => {
    const last = new Date('2026-11-01T10:00:00Z');
    expect(ProjectAlertPolicy.stalledKey('p1', last)).toBe(ProjectAlertPolicy.stalledKey('p1', new Date(last)));
    expect(ProjectAlertPolicy.dueSoonKey('m1', '2026-11-09')).toBe('milestone-due-soon:m1:2026-11-09');
  });
});
