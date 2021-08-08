import { ok, err } from 'neverthrow'
import {
  int,
  path,
  Route,
} from '../../../src/index'
import * as routeError from '../../../src/errors'

import { todoModel } from '../db'

const getTodoPath = path([ 'todos', int('todoId') ])

const findTodo = (todoId: number) =>
  todoModel.find({
    id: todoId
  })
  .mapErr((_dbError) =>
    routeError.other('Unkown')
  )


export const getTodo = Route.get(getTodoPath, ({ pathParams }) =>
  findTodo(
    pathParams.todoId
  )
  .andThen((maybeTodo) => {
    if (!maybeTodo) {
      return err(
        routeError.notFound()
      )
    }

    return ok({
      data: maybeTodo
    })
  })
)

