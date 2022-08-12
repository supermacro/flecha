import { flecha } from 'flecha'

import { createTodo } from './routes/create-todo'
import { getTodo } from './routes/get-todo'
import { listTodos } from './routes/list-todos'
import { deleteTodo } from './routes/delete-todo'
import { emptyBody } from './routes/empty-body'

const app = flecha()
  .withRoute(createTodo)
  .withRoute(getTodo)
  .withRoute(deleteTodo)
  .withRoute(listTodos)
  .withRoute(emptyBody)


const { PORT } = process.env

const envPort = typeof PORT === 'string'
  ? parseInt(PORT, 10)
  : undefined

if (Number.isNaN(envPort)) {
  throw new Error(`Invalid PORT env var: ${process.env.PORT}`)
}
  
const DEFAULT_PORT = 3000
const appPort = envPort || DEFAULT_PORT

app.listen(appPort, () => {
  console.log(`Listening on port ${appPort}`)
})

