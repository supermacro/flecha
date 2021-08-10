import { JSONObject } from "../../../src"
import { okAsync, ResultAsync } from "neverthrow"

export interface Todo extends JSONObject {
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


interface Id {
  id: number
}


type TodoInfo = Pick<Todo, 'title'>


const createTodoId = () => 
  Math.floor(
    Math.random() * (10 ** 9)
  )


const insert = ({ title }: TodoInfo): QueryResult<Todo> => {
  const id = createTodoId()

  const newTodo = {
    id,
    title,
    completed: false,
  }

  Object.assign(
    todos,
    { [id]: newTodo }
  )


  return okAsync(newTodo)
}


const selectMany = (
  query: Query | void
): QueryResult<Todo[]> => {
  console.log(query)

  const todoList = Object.values(todos)

  return okAsync(todoList)
}


const find = ({ id }: Id): QueryResult<Todo | null> =>
  okAsync(
    todos[id]
  )


const delete_ = ({ id }: Id): QueryResult<Todo | null> => {
  const associatedTodo = todos[id]

  if (associatedTodo) {

    delete todos[id]

    return okAsync(associatedTodo)
  }

  return okAsync(null)
}


export const todoModel = {
  insert,
  find,
  selectMany,
  delete: delete_,
}


