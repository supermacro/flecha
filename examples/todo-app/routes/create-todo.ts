import { z } from 'zod'
import {
  path,
  Route,
} from '../../../src/index'
import * as routeError from '../../../src/errors'

import { todoModel } from '../db'

const todoDataParser = z.object({
  title: z.string()
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

