import { okAsync } from 'neverthrow'
import { z } from 'zod'
import {
  str,
  int,
  path,
  noBody,
  flecha,
  Route,
} from '../../src/index'

import { todoModel } from './db'


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
  ({ pathParams }) => {

    const maybeTodo = todoModel.find({
      id: pathParams.todoId
    })


    return okAsync({
      data: maybeTodo,
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




const app = flecha()
  .withRoute(addTodo)
  .withRoute(getTodo)
  .withRoute(deleteTodo)


const PORT = 3000

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})


