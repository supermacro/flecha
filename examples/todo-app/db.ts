import { okAsync, ResultAsync } from "neverthrow"

interface Todo {
  id: number
  title: string
  completed: boolean
}

type TodoTable = Record<number, Todo>


const todos: TodoTable = {
  3903902: {
    id: 3903902,
    title: 'Wash dishes',
    completed: false,
  },
  9903912: {
    id: 9903912,
    title: 'Learn F#',
    completed: false,
  },
  3782199: {
    id: 3782199,
    title: 'Tend to garden',
    completed: true,
  }
}


export type DbError
  = { error: 'Unknown' }
  | { error: 'InvalidDataReturnedFromQuery', context?: string }
  | { error: 'UniqueConstraintViolation' }
  | { error: 'InvalidForeignKeyReference' }
  | { error: 'ColumnConstraintViolation', column: string, rawDbMessage: string }
  | { error: 'NotFound', context?: string }
  | { error: 'Conflict', context?: string }
  | { error: 'FailedTransaction' }
  | { error: 'ConnectionError' }


type QueryResult<T> = ResultAsync<T, DbError>


interface Query {
  filter?: {
    completed?: boolean
    title?: string
  }
}


const selectMany = ({ filter }: Query): QueryResult<Todo[]> => {
  const todoList = Object.values (todos)

  return okAsync(todoList)
}

const find = ({ id }: { id: number }): QueryResult<Todo | null> =>
  okAsync(
    todos[id]
  )



export const todoModel = {
  find,
  selectMany,
}


