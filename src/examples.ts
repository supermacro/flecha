import { okAsync } from 'neverthrow'
import { z } from 'zod'
import {
  route,
  str,
  int,
  path,
  noBody,
  flecha,
} from 'index'

const todoDataParser = z.object({
  title: z.string()
})

const addTodo = route(
  // represents the following URL path
  //    /todos/:todoId/:swag
  path([ 'todos' ]),
  todoDataParser,
  ({ body, pathParams }) => {
    const yo = body.title

    return okAsync({ data: null })
  }
)



const getTodo = route(
  path([ 'todos', str('todoId') ]),
  noBody(),
  ({ pathParams }) => {

    const todoId = pathParams.todoId

    return okAsync({
      data: {
        title: 'Read email',
        completed: false,
      }
    })
  }
)


const deleteTodo = route(
  path([ 'todos', str('todoId') ]),
  noBody(),
  ({ pathParams }) => {

    const todoId = pathParams.todoId

    return okAsync({ data: true })
  }
)


const router = flecha()
  .withRoute(addTodo)
  .withRoute(getTodo)
  .withRoute(deleteTodo)









/*



export const flecha = () => undefined

const server = flecha()
  .withRoute()
  .withRoute()



server.withRoute(addTodo)
*/
