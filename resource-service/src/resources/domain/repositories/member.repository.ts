import { Member } from '../model/entities/member';

export abstract class MemberRepository {
  abstract upsert(member: Member): Promise<void>;
  abstract findById(id: string): Promise<Member | null>;
  abstract findAll(): Promise<Member[]>;
}
