import { Hono } from "hono"
import { csrf } from "hono/csrf"
import { authController } from "./modules/auth/auth.controller"
import { mediaController } from "./modules/media/media.controller"
import { pokemonController } from "./modules/pokemon/pokemon.controller"
import { todosController } from "./modules/todos/todos.controller"

const app = new Hono()

app.use(csrf())

export const appRouter = app
  // Extends routes here...
  .route("/auth", authController)
  .route("/media", mediaController)
  .route("/pokemon", pokemonController)
  .route("/todos", todosController)

export type AppRouter = typeof appRouter
