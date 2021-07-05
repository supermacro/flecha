import { okAsync } from 'neverthrow'
import { z } from 'zod'
import {
  str,
  int,
  path,
  noBody,
  flecha,
  Route,
} from 'index'

const todoDataParser = z.object({
  title: z.string()
})


const addTodo = Route.post(
  path([ 'todos' ]),
  todoDataParser,
  ({ body, /*pathParams*/ }) => {
    const yo = body.title
    
    console.log(yo)

    return okAsync({ data: null })
  }
)



const getTodo = Route.get(
  path([ 'todos', int('todoId') ]),
  noBody(),
  ({ /*pathParams*/ }) => {

    // const todoId = pathParams.todoId

    return okAsync({
      data: {
        title: 'Read email',
        completed: false,
      }
    })
  }
)


const deleteTodo = Route.del(
  path([
    'todos', str('todoId')
  ]),
  noBody(),
  ({ /*pathParams*/ }) => {

    // const todoId = pathParams.todoId

    return okAsync({ data: true })
  }
)


const router = flecha()
  .withRoute(addTodo)
  .withRoute(getTodo)
  .withRoute(deleteTodo)



const PORT = 3000

router.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})




/*



export const flecha = () => undefined

const server = flecha()
  .withRoute()
  .withRoute()



server.withRoute(addTodo)
*/
