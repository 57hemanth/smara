import { eq, and } from 'drizzle-orm';
import { DbClient } from '../client';
import { workspaces, type Workspace, type NewWorkspace } from '../schema/workspaces';

export class WorkspaceRepository {
  constructor(private db: DbClient) {}

  async findById(id: string): Promise<Workspace | undefined> {
    return await this.db.query.workspaces.findFirst({
      where: eq(workspaces.id, id),
    });
  }

  async findByUserId(userId: string): Promise<Workspace[]> {
    return await this.db.query.workspaces.findMany({
      where: eq(workspaces.user_id, userId),
    });
  }

  async findByUserIdAndName(userId: string, name: string): Promise<Workspace | undefined> {
    return await this.db.query.workspaces.findFirst({
      where: and(
        eq(workspaces.user_id, userId),
        eq(workspaces.name, name)
      ),
    });
  }

  async create(data: NewWorkspace): Promise<Workspace> {
    const result = await this.db.insert(workspaces).values(data).returning();
    return result[0];
  }

  async update(id: string, data: Partial<NewWorkspace>): Promise<Workspace | undefined> {
    const result = await this.db
      .update(workspaces)
      .set({ ...data, updated_at: new Date().toISOString() })
      .where(eq(workspaces.id, id))
      .returning();
    return result[0];
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(workspaces).where(eq(workspaces.id, id));
  }
}

