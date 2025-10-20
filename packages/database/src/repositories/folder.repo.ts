import { eq, and } from 'drizzle-orm';
import { DbClient } from '../client';
import { folders, type Folder, type NewFolder } from '../schema/folders';

export class FolderRepository {
  constructor(private db: DbClient) {}

  async findById(id: string): Promise<Folder | undefined> {
    return await this.db.query.folders.findFirst({
      where: eq(folders.id, id),
    });
  }

  async findByUserId(userId: string): Promise<Folder[]> {
    return await this.db.query.folders.findMany({
      where: eq(folders.user_id, userId),
    });
  }

  async findByUserIdAndName(userId: string, name: string): Promise<Folder | undefined> {
    return await this.db.query.folders.findFirst({
      where: and(
        eq(folders.user_id, userId),
        eq(folders.name, name)
      ),
    });
  }

  async create(data: NewFolder): Promise<Folder> {
    const result = await this.db.insert(folders).values(data).returning();
    return result[0];
  }

  async update(id: string, data: Partial<NewFolder>): Promise<Folder | undefined> {
    const result = await this.db
      .update(folders)
      .set({ ...data, updated_at: new Date().toISOString() })
      .where(eq(folders.id, id))
      .returning();
    return result[0];
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(folders).where(eq(folders.id, id));
  }
}

