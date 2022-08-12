import { okAsync, errAsync } from 'neverthrow'
import {
  int,
  path,
  Route,
  routeError,
} from 'flecha'

import { todoModel } from '../db'


const a = [ 'todos', int('todoId') ] as const

const deleteTodoPath = path(a)

export const deleteTodo = Route.delete(deleteTodoPath, ({ pathParams }) =>
  todoModel.delete({
    id: pathParams.todoId
  })
  .mapErr((_dbError) =>
    routeError.other('Unkown')
  )
  .andThen((maybeDeletedTodo) => {
    if (!maybeDeletedTodo) {
      return errAsync(
        routeError.notFound()
      )
    }

    return okAsync({
      data: maybeDeletedTodo,
    })
  })
)

