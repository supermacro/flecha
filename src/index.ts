
/* Desired behaviours & features:
 *    Middleware:
 *
 *      [ ] - ability to process HTTP requests prior to arriving a handler
 *
 *
 *    Built-In Parsers
 *
 *      [ ] - Ability to parse url paths
 *      [ ] - Ability to parse query params 
 *
 *
 *
 *
 * For v1
 *    JSON request bodies only
 *
 *    Hook into existing ExpressJS app
 *
 *
 *    Test Cases:
 *
 *      [ ] - as a user I can handle different Authorization checks
 *          Example:
 *            - JWT deserialization
 *            - Simple Authorization
 *
 *      [ ] - as a user, I can create middleware that allows me to
 *            check if the user has permission to access this endpoint
 *
 *            Eg. RBAC
 */


import { Result, ok, err } from 'neverthrow'
import { RouteError } from './errors'
import { z, ZodType } from 'zod'


type Decoder<T> = ZodType<T>




/**
 * Custom subset of the JSON spec that omits the 'password' field from JSON objects.
 *
 * source:
 *  - https://www.typescriptlang.org/play?#code/C4TwDgpgBAUgygeQHIDUCGAbArhAzlAXgCgooAfKAOywFsAjCAJxPKl2EYEtKBzFi6hgz8odAPZiMENJRHxkCOgCsIAY2BzEqTDlwBtALpEioSLC2KV6wlADeUPQGsAXGw7ceB1-O3Y8UAF8oADI7KDA0XFwAdzFGABMAfldKCAA3JkDjVTFKdihYsTBcTjxvC2U1YBtbFlIIqNiE1wByeLRgNFFGaVUACwBCIYGWogDjIA
 *  - https://stackoverflow.com/q/58594051/4259341
 */
export type JSONValues =
  | number
  | string
  | null
  | boolean
  | JSONObject
  | JSONValues[]

export interface JSONObject {
  [k: string]: JSONValues
} 


type NonEmptyArray<T> = [T, ...T[]]



interface RouteErrorHttpResponse {
  statusCode: number
  errorMsg: string
}


const mapRouteError = (err: RouteError): RouteErrorHttpResponse => {
  switch (err.type) {
    case 'InvalidToken': {
      return {
        statusCode: 400,
        errorMsg: 'Invalid Token Format',
      }
    }

    case 'MissingHeader': {
      return {
        statusCode: 400,
        errorMsg: 'Missing `Authorization` header',
      }
    }

    case 'InvalidSession': {
      return {
        statusCode: 401,
        errorMsg: 'Invalid Session',
      }
    }

    case 'BadRequest': {
      return {
        statusCode: 400,
        errorMsg: err.context,
      }
    }

    case 'Conflict': {
      return {
        statusCode: 409,
        errorMsg: 'Conflict',
      }
    }

    case 'NotFound': {
      const withMaybeContext = err.context ? ` - ${err.context}` : ''

      return {
        statusCode: 404,
        errorMsg: `Not Found${withMaybeContext}`,
      }
    }

    case 'Forbidden': {
      return {
        statusCode: 403,
        errorMsg: 'You do not have access to this resource.'
      }
    }

    case 'Other': {
      const errorInfo = [err.error ? err.error : '', `Context: ${err.context}`]
        .filter((val) => val !== '')
        .join('\n')

      logger.error(errorInfo)

      return {
        statusCode: 500,
        errorMsg: 'An Internal Error Occurred :(',
      }
    }
  }
}





export const flecha = () => undefined

const server = flecha()
  .withRoute()
  .withRoute()




type PathParseError = 'path_parse_error'

interface PathParser<T extends string | number, P extends string> {
  tag: 'path_parser'
  path_name: P,
  fn: (raw: Record<string, undefined | string>) => Result<T, PathParseError>
}

type UrlPath = NonEmptyArray<string | PathParser<string, any> | PathParser<number, any>>


const str = <P extends string>(pathParamName: P): PathParser<string, P> => {
  return {
    tag: 'path_parser',
    path_name: pathParamName,
    fn: (rawPathParams) => {
      const pathParam = rawPathParams[pathParamName]

      if (pathParam) {
        return ok(pathParam)
      }

      return err('path_parse_error')
    }
  }
}


const int = <P extends string>(pathParamName: P): PathParser<number, P> => {
  return {
    tag: 'path_parser',
    path_name: pathParamName,
    fn: (rawPathParams) => {
      const pathParam = rawPathParams[pathParamName]

      if (pathParam) {
        const BASE_10 = 10
        const parsedInteger = parseInt(pathParam, BASE_10)

        if (Number.isNaN(parsedInteger)) {
          return err('path_parse_error')
        }

        return ok(parsedInteger)
      }

      return err('path_parse_error')
    }
  }
}


type ExtractUrlPathParams<T extends UrlPath[number]> =
  T extends PathParser<infer U, string>
    ? { [K in T['path_name']]: U } 
    : undefined


// /todos/:todoId/:weekday
//
// todoId parsed as a string
// weekday parsed as an integer
const urlPath = [ 'todos', str('todoId'), int('weekday') ] 




// https://stackoverflow.com/questions/50374908/transform-union-type-to-intersection-type
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void)
    ? I
    : never


type Params = UnionToIntersection<ExtractUrlPathParams<(typeof urlPath)[number]>>




// alternative to using `as const`
// use this to ensure ExtractUrlPathParams works
// additionally, wrap UrlPath to prevent users from passing in a array literal into `route`
const path = <T extends UrlPath>(path: T): { tag: 'url_path', path: T } => ({
  tag: 'url_path',
  path,
}) 






const urlPath2 = path([ 'todos', str('todoId'), int('weekday') ])




const parseUrlPath = <T extends UrlPath>(path: T, rawRequestUrl: string): ExtractUrlPathParams<T[number]> => {

  return undefined
}


const yooooo = parseUrlPath(urlPath2, 'duudud')


const cuid = <T extends string>(val: T) => {
  return val
}


cuid('yo')


interface RouteConfig<B> {
  parser: Decoder<B>
}
 

const route = <B, T>(
  { parser, requiredPermissions }: RouteConfig<B>,




const addTodo = route(
  path([ 'todos', str('todoId') ]),
  noConfig,
  bodyParser: parser,
  middleware: [ list, of, ordered, functions ]
, ({ pathParams, body }) => {

})




const getTodo = route({
  path: [ 'todos', str 'todoId', int 'age' ],
  bodyParser: parser,
  middleware: [ list, of, ordered, functions ]
}, ({ }) => {

})





server.withRoute(addTodo)
