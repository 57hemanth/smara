import { eq } from 'drizzle-orm';
import { DbClient } from '../client';
import { users, type User, type NewUser } from '../schema/users';

export class UserRepository {
  constructor(private db: DbClient) {}

  async findById(id: string): Promise<User | undefined> {
    return await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
  }

  async create(data: NewUser): Promise<User> {
    const result = await this.db.insert(users).values(data).returning();
    return result[0];
  }

  async update(id: string, data: Partial<NewUser>): Promise<User | undefined> {
    const result = await this.db
      .update(users)
      .set({ ...data, updated_at: new Date().toISOString() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }

  async list(limit: number = 100, offset: number = 0): Promise<User[]> {
    return await this.db.query.users.findMany({
      limit,
      offset,
    });
  }
}

