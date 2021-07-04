
/* Desired behaviours & features for V1:
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
 *    Plug into any ExpressJS application
 *
 *    JSON request bodies only for now
 *    
 *
 *
 *
 * Ideas:
 *
 *    Using opaque types to prevent users from accessing internals or
 *    creating structurally equivalent types / values:
 *        https://stackoverflow.com/questions/56737033/how-to-define-an-opaque-type-in-typescript
 *
 *
 *        newtype-ts seems to allow for operating on Opaque values:
 *          https://gcanti.github.io/newtype-ts/
 *
 *
 *
 *    Partial type arguments one day:
 *      
 *      https://github.com/Microsoft/TypeScript/pull/26349
 *
 * TODOS: 
 *    
 *    - Better error messages for parsing errors
 *        Currently I'm just returning the raw Zod error
 *
 *
 * --------------------------------------------------
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


import { Result, ResultAsync, ok, err, okAsync } from 'neverthrow'
import { RouteError } from './errors'
import { z, ZodType } from 'zod'
import { Request, Response } from 'express'


type Decoder<T> = ZodType<T>




/**
 * source:
 *  - https://www.typescriptlang.org/play?#code/C4TwDgpgBAUgygeQHIDUCGAbArhAzlAXgCgooAfKAOywFsAjCAJxPKl2EYEtKBzFi6hgz8odAPZiMENJRHxkCOgCsIAY2BzEqTDlwBtALpEioSLC2KV6wlADeUPQGsAXGw7ceB1-O3Y8UAF8oADI7KDA0XFwAdzFGABMAfldKCAA3JkDjVTFKdihYsTBcTjxvC2U1YBtbFlIIqNiE1wByeLRgNFFGaVUACwBCIYGWogDjIA
 *  - https://stackoverflow.com/q/58594051/4259341
 */
export type JSONValues =
  | number
  | string
  | null
  | boolean
  | { [k: string]: JSONValues }
  | JSONValues[]


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

type UrlPathParts = NonEmptyArray<string | PathParser<string, any> | PathParser<number, any>>


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


type ExtractUrlPathParams<T extends UrlPathParts[number]> =
  T extends PathParser<infer U, string>
    ? { [K in T['path_name']]: U } 
    : undefined



// alternative to using `as const`
// use this to ensure ExtractUrlPathParams works
// additionally, wrap UrlPath to prevent users from passing in a array literal into `route`
const path = <U extends UrlPathParts>(path: U): { tag: 'url_path', path: U } => ({
  tag: 'url_path',
  path,
}) 


// /todos/:todoId/:weekday
//
// todoId parsed as a string
// weekday parsed as an integer
const urlPath = [ 'todos', str('todoId'), int('weekday') ] 

const urlPath2 = path([ 'todos', str('todoId'), int('weekday') ])



// https://stackoverflow.com/questions/50374908/transform-union-type-to-intersection-type
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void)
    ? I
    : never


type Params = UnionToIntersection<ExtractUrlPathParams<(typeof urlPath)[number]>>


type GetParsedParams<U extends UrlPathParts> = UnionToIntersection<ExtractUrlPathParams<U[number]>>


type Yo = GetParsedParams<(typeof urlPath2)['path']>













const parseUrlPath = <T extends UrlPathParts>(
  path: T,
  rawRequestUrl: string
): UnionToIntersection<ExtractUrlPathParams<T[number]>> => {

  return undefined
}


const yooooo = parseUrlPath(urlPath2.path, 'duudud')




interface RequestData<P, B = null> {
  body: B
  pathParams: P,
  // user: UserToken  <-- TODO
  // utils: Utils <-- TODO
}


interface AppData<T> {
  data: T
}


type RouteResult<T> = ResultAsync<AppData<T>, RouteError>


type RouteHandler<T, P, B = unknown> = (
  data: RequestData<P, B>
) => RouteResult<T>



type Serializer <T> = (raw: T) => JSONValues


const handleHandlerResult = <T>(
  handlerResult: RouteResult<T>,
  serializer: Serializer<T>,
  res: Response
): void => {
  handlerResult
    .map(({ data }) => {
      res.status(200).json({
        data: serializer(data),
      })
    })
    .mapErr((error) => {
      const { statusCode, errorMsg } = mapRouteError(error)
      res.status(statusCode).json({ error: errorMsg })
    })
}



const route = <T, U extends UrlPathParts, B>(
  // method: Method  <-- TODO
  urlPathParser: { tag: 'url_path', path: U },
  bodyParser: Decoder<B>,
  handler: RouteHandler<T, GetParsedParams<U>, B>
) => ({
  tag: 'route',
  handler: (serializer: Serializer<T>) => (req: Request, res: Response) => {
    const requestBodyDecodeResult = bodyParser.safeParse(req.body)

    if (requestBodyDecodeResult.success === false) {
      res.status(400).json({
        error: requestBodyDecodeResult.error.errors,
      })

      return
    }

    const pathParams = parseUrlPath(urlPathParser.path, req.path)

    const handlerResult = handler({
      body: requestBodyDecodeResult.data,
      pathParams,
    })

    handleHandlerResult(handlerResult, serializer, res)
  }
})



const todoDataParser = z.object({
  title: z.string()
})

const addTodo = route(
  // represents the following URL path
  //    /todos/:todoId/:swag
  path([ 'todos', str('todoId'), int('swag') ]),
  todoDataParser,
  ({ body, pathParams }) => {
    const yo = body.title

    const todoId = pathParams.todoId
    const swag = pathParams.swag

    return okAsync({ data: null })
  }
)




const getTodo = route({
  path: [ 'todos', str 'todoId', int 'age' ],
  bodyParser: parser,
  middleware: [ list, of, ordered, functions ]
}, ({ body, pathParams }) => {

})





server.withRoute(addTodo)
