import { Env, Hono } from "hono";
import { SearchController } from "../contollers/search.controller";
import { Variables } from "../types/env";

const searchRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

searchRoutes.post('/', SearchController.search);

export default searchRoutes;