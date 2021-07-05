
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
 *    Plug into an existing ExpressJS application
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
 *    - Provide recommended TSConfig
 *        Maybe provide a tool that analyses a project's tsconfig and provides
 *        warnings or suggestions
 *
 *
 * --------------------------------------------------
 *    Test Cases:
 *
 *      [ ] - It successfully binds to a port and correctly sets up
 *            all request handlers for the server
 *
 *
 *      [ ] - as a user I can handle different Authorization checks
 *          Example:
 *            - JWT deserialization
 *            - Simple Authorization
 *
 *
 *      [ ] - How to handle CORS
 *
 *
 *      [ ] - as a user, I can create middleware that allows me to
 *            check if the user has permission to access this endpoint
 *
 *            Eg. RBAC
 */


import { Result, ResultAsync, ok, err, okAsync } from 'neverthrow'
import { RouteError } from './errors'
import { z, ZodType } from 'zod'
import express, { Express, Request as XRequest, Response as XResponse } from 'express'
import { Newtype, iso } from 'newtype-ts'



type Method
  = 'GET'
  | 'PUT'
  | 'POST'
  | 'DELETE'
  | 'PATCH'



type Decoder<T> = ZodType<T>

type Serializer <T> = (raw: T) => JSONValues

type Handler<T> = (serializer: Serializer<T>) => (req: XRequest, res: XResponse) => void

interface RouteInfo<T> {
  rawPath: string
  method: Method
  handler: Handler<T>
}

interface Route<T> extends Newtype<{ readonly Route: unique symbol }, RouteInfo<T>> {}

const createIsoRoute = <T>() => iso<Route<T>>()




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
      /*
      const errorInfo = [err.error ? err.error : '', `Context: ${err.context}`]
        .filter((val) => val !== '')
        .join('\n')

      logger.error(errorInfo)
      */

      return {
        statusCode: 500,
        errorMsg: 'An Internal Error Occurred :(',
      }
    }
  }
}



export const noBody = (): Decoder<never> => z.never()



type PathParseError = 'path_parse_error'

interface PathParser<T extends string | number, P extends string> {
  tag: 'path_parser'
  path_name: P,
  fn: (raw: Record<string, undefined | string>) => Result<T, PathParseError>
}

type UrlPathParts = NonEmptyArray<string | PathParser<string, any> | PathParser<number, any>>


export const str = <P extends string>(pathParamName: P): PathParser<string, P> => {
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


export const int = <P extends string>(pathParamName: P): PathParser<number, P> => {
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
    : { }



// alternative to using `as const`
// use this to ensure ExtractUrlPathParams works
// additionally, wrap UrlPath to prevent users from passing in a array literal into `route`
export const path = <U extends UrlPathParts>(path: U): { tag: 'url_path', path: U } => ({
  tag: 'url_path',
  path,
}) 


// https://stackoverflow.com/questions/50374908/transform-union-type-to-intersection-type
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void)
    ? I
    : never



type GetParsedParams<U extends UrlPathParts> = UnionToIntersection<ExtractUrlPathParams<U[number]>>



const parseUrlPath = <T extends UrlPathParts>(
  path: T,
  rawRequestUrl: string
): UnionToIntersection<ExtractUrlPathParams<T[number]>> => {

  return undefined
}




interface RequestData<P, B = null> {
  body: B
  pathParams: P,
  // request: FlechaRequest <-- TODO
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





const handleHandlerResult = <T>(
  handlerResult: RouteResult<T>,
  serializer: Serializer<T>,
  res: XResponse
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



const getRawPathFromUrlPathParts = (parts: UrlPathParts): string => {
  const joinedParts = parts.map((part) =>
    typeof part === 'string'
      ? part
      // using the "Named Route Parameters" convention provided by
      // ExpressJS:
      // http://expressjs.com/en/guide/routing.html#route-parameters
      : `:${part.path_name}`
    ).join('/')

  return '/' + joinedParts
}


const route = <T, U extends UrlPathParts, B>(
  method: Method,
  urlPathParser: { tag: 'url_path', path: U },
  bodyParser: Decoder<B>,
  handler: RouteHandler<T, GetParsedParams<U>, B>
) => createIsoRoute<T>().wrap({
  method,

  rawPath: getRawPathFromUrlPathParts(urlPathParser.path),

  handler: (serializer: Serializer<T>) => (req: XRequest, res: XResponse) => {
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
}

  
)




export namespace Route {
  export const get = <T, U extends UrlPathParts, B>(
    urlPathParser: { tag: 'url_path', path: U },
    bodyParser: Decoder<B>,
    handler: RouteHandler<T, GetParsedParams<U>, B>
  ) =>
    route('GET', urlPathParser, bodyParser, handler)

  export const post = <T, U extends UrlPathParts, B>(
    urlPathParser: { tag: 'url_path', path: U },
    bodyParser: Decoder<B>,
    handler: RouteHandler<T, GetParsedParams<U>, B>
  ) =>
    route('POST', urlPathParser, bodyParser, handler)


  export const del = <T, U extends UrlPathParts, B>(
    urlPathParser: { tag: 'url_path', path: U },
    bodyParser: Decoder<B>,
    handler: RouteHandler<T, GetParsedParams<U>, B>
  ) =>
    route('POST', urlPathParser, bodyParser, handler)
}




class Flecha<R extends Route<any>> {
  private routes: R[]
  private expressApp: Express | undefined

  constructor(newRoutes: R[]) {
    this.routes = newRoutes
  }

  withRoute<T extends Route<any>>(route: T): Flecha<T | R> {
    return new Flecha([
      ...this.routes,
      route,
    ])
  }

  withExpressApp(app: Express) {
    this.expressApp = app
  }

  listen(port: number, cb: () => void) {
    if (this.expressApp) {
      // it's the responsibility of the "host" express app
      // to bind to a port in this case
      return
    }

    const expressApp = express()


    for (const route of this.routes) {
      expressApp.request


    }

    expressApp.listen(port, cb)
  }
}

export const flecha = () => new Flecha([])







