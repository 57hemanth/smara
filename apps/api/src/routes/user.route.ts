import { Env, Hono } from "hono";
import type { Variables } from "../types/env";
import { UserController } from "../contollers/user.controller";

const userRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

userRoutes.get('/', UserController.getUser);
userRoutes.post('/', UserController.createUser);

export default userRoutes;