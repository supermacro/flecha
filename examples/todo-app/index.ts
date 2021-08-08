import {
  flecha,
} from '../../src/index'

import { createTodo } from './routes/create-todo'
import { getTodo } from './routes/get-todo'
import { listTodos } from './routes/list-todos'
import { deleteTodo } from './routes/delete-todo'



const app = flecha()
  .withRoute(createTodo)
  .withRoute(getTodo)
  .withRoute(deleteTodo)
  .withRoute(listTodos)


const PORT = 3000

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})


