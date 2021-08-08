import {
  path,
  Route,
} from '../../../src/index'
import * as routeError from '../../../src/errors'

import { todoModel } from '../db'

const listTodosPath = path([ 'todos' ])

export const listTodos = Route.get(listTodosPath, () =>
  todoModel.selectMany()
    .map((todoList) => {
      return {
        data: todoList
      }
    })
    .mapErr((_dbError) =>
      routeError.other('Unkown')
    )
)

