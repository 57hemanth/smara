import { Context } from "hono";
import type { Env, Variables } from "../types/env";
import { createDbClient, UserRepository } from "@smara/database";
import { userSchema } from "@smara/schema/user";
import { nanoid } from "nanoid";
import { hashPassword, verifyPassword, generateToken } from "../utils/auth.utils";

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

      // Hash password
      const hashedPassword = await hashPassword(parsed.data.password);

      const newUser = await userRepo.create({
        id: nanoid(),
        name: parsed.data.name,
        email: parsed.data.email,
        password: hashedPassword,
      });

      // Generate JWT token
      const token = await generateToken(newUser.id, c.env.JWT_SECRET);

      const { password, ...userWithoutPassword } = newUser;
      return c.json({ 
        user: userWithoutPassword,
        token 
      }, 201);
    } catch (error) {
      console.error('Error creating user:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  static async login(c: Context<{ Bindings: Env; Variables: Variables }>) {
    try {
      const body = await c.req.json();
      const { email, password } = body;

      if (!email || !password) {
        return c.json({ error: 'Email and password are required' }, 400);
      }

      const db = createDbClient(c.env.DB);
      const userRepo = new UserRepository(db);

      // Find user by email
      const user = await userRepo.findByEmail(email);
      if (!user) {
        return c.json({ error: 'Invalid credentials' }, 401);
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return c.json({ error: 'Invalid credentials' }, 401);
      }

      // Generate JWT token
      const token = await generateToken(user.id, c.env.JWT_SECRET);

      const { password: _, ...userWithoutPassword } = user;
      return c.json({ 
        user: userWithoutPassword,
        token 
      });
    } catch (error) {
      console.error('Error during login:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
}

export { UserController };