import { Context } from "hono";
import type { Env, Variables } from "../types/env";
import { createDbClient, UserRepository } from "@smara/database";
import { userSchema } from "@smara/schema/user";
import { nanoid } from "nanoid";

class UserController {
  static async getUser(c: Context<{ Bindings: Env; Variables: Variables }>) {
    const db = createDbClient(c.env.DB);
    const userRepo = new UserRepository(db);
    
    const userId = c.var.user_id;
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user = await userRepo.findById(userId);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Don't return password
    const { password, ...userWithoutPassword } = user;
    return c.json(userWithoutPassword);
  }

  static async createUser(c: Context<{ Bindings: Env; Variables: Variables }>) {
    try {
      const body = await c.req.json();
      
      // Validate with Zod schema
      const parsed = userSchema.omit({ 
        id: true, 
        created_at: true, 
        updated_at: true 
      }).safeParse(body);
      
      if (!parsed.success) {
        return c.json({ error: 'Invalid input', details: parsed.error }, 400);
      }

      const db = createDbClient(c.env.DB);
      const userRepo = new UserRepository(db);

      // Check if user already exists
      const existing = await userRepo.findByEmail(parsed.data.email);
      if (existing) {
        return c.json({ error: 'User already exists' }, 409);
      }

      // TODO: Hash password before storing (add bcrypt/argon2 in production)
      const hashedPassword = parsed.data.password;

      const newUser = await userRepo.create({
        id: nanoid(),
        name: parsed.data.name,
        email: parsed.data.email,
        password: hashedPassword,
      });

      const { password, ...userWithoutPassword } = newUser;
      return c.json(userWithoutPassword, 201);
    } catch (error) {
      console.error('Error creating user:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
}

export { UserController };