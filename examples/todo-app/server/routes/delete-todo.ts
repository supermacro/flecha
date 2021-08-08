import { okAsync, errAsync } from 'neverthrow'
import {
  int,
  path,
  Route,
} from '../../../../src/index'
import * as routeError from '../../../../src/errors'

import { todoModel } from '../db'

const deleteTodoPath = path([ 'todos', int('todoId') ])

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

