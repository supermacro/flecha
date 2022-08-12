import {
  path,
  Route,
  routeError,
  parser,
} from 'flecha'

import { todoModel } from '../db'

const todoDataParser = parser.object({
  title: parser.string()
})

export const createTodo = Route.post(
  path([ 'todos' ]),
  todoDataParser,
  ({ body }) => 
    todoModel.insert(body)
      .mapErr((_dbError) =>
        routeError.other('Unkown')
      )
      .map((todo) => {
        return {
          data: todo,
        }
      })
  )

