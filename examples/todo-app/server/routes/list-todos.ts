import {
  path,
  Route,
  routeError,
} from 'flecha'

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

