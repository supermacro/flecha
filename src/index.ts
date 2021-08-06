
/*       
 *
 *
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


import { Result, ResultAsync, ok, err } from 'neverthrow'
import { RouteError } from './errors'
import { z, ZodType } from 'zod'
import express, { Express, Request as XRequest, Response as XResponse } from 'express'
import { Newtype, iso } from 'newtype-ts'



type Method
  = 'get'
  | 'put'
  | 'post'
  | 'delete'
  | 'patch'
  | 'options'



type Decoder<T> = ZodType<T>

type Handler = (req: XRequest, res: XResponse) => void

interface RouteInfo {
  rawPath: string
  method: Method
  handler: Handler
}

interface Route<T> extends Newtype<{ readonly Route: unique symbol }, RouteInfo> {}




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



export const noBody = (): Decoder<void> => z.void()



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







/*
  
// when T is a union, the `extends` logic gets applied over each
// member of the union, conceptually like "map" on arrays
// 
// Usage:
//
// Given:
// type Routes = Route<string> | Route<number> | Route<boolean>
//
// Then
// type InnerValues = RouteResponses<Routes>
//     ---> type InnerValues = string | number | boolean
type RouteResponses<T> = T extends Route<infer U> ? U : never



*/





const parseUrlPath = <T extends UrlPathParts>(
  _path: T,
  _rawRequestUrl: string
): UnionToIntersection<ExtractUrlPathParams<T[number]>> => {

  return { yo: 'string' } as UnionToIntersection<ExtractUrlPathParams<T[number]>>
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


type RouteHandler<T extends JSONValues, P, B = unknown> = (
  data: RequestData<P, B>
) => RouteResult<T>





const handleHandlerResult = <T>(
  handlerResult: RouteResult<T>,
  res: XResponse
): void => {
  handlerResult
    .map(({ data }) => {
      res.status(200).json({
        data,
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


const route = <T extends JSONValues, U extends UrlPathParts, B>(
  method: Method,
  urlPathParser: { tag: 'url_path', path: U },
  bodyParser: Decoder<B>,
  handler: RouteHandler<T, GetParsedParams<U>, B>
) => iso<Route<T>>().wrap({
  method,

  rawPath: getRawPathFromUrlPathParts(urlPathParser.path),

  handler: (req: XRequest, res: XResponse) => {
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

    handleHandlerResult(handlerResult, res)
  }
})




export namespace Route {
  export const get = <T extends JSONValues, U extends UrlPathParts, B>(
    urlPathParser: { tag: 'url_path', path: U },
    bodyParser: Decoder<B>,
    handler: RouteHandler<T, GetParsedParams<U>, B>
  ) =>
    route('get', urlPathParser, bodyParser, handler)

  export const post = <T extends JSONValues, U extends UrlPathParts, B>(
    urlPathParser: { tag: 'url_path', path: U },
    bodyParser: Decoder<B>,
    handler: RouteHandler<T, GetParsedParams<U>, B>
  ) =>
    route('post', urlPathParser, bodyParser, handler)


  export const del = <T extends JSONValues, U extends UrlPathParts, B>(
    urlPathParser: { tag: 'url_path', path: U },
    bodyParser: Decoder<B>,
    handler: RouteHandler<T, GetParsedParams<U>, B>
  ) =>
    route('post', urlPathParser, bodyParser, handler)
}




class Flecha_<R extends Route<any>> {
  private routes: R[]

  // Flecha can be plugged into an existing
  // "host" express application
  private expressAppHost: Express | undefined


  constructor(newRoutes: R[]) {
    this.routes = newRoutes
  }

  withRoute<T extends Route<any>>(route: T): Flecha<T | R> {
    return new Flecha_([
      ...this.routes,
      route,
    ])
  }

  withExpressApp(app: Express) {
    this.expressAppHost = app
  }

  listen(
    port: number,
    cb: () => void,
  ) {
    if (this.expressAppHost) {
      // it's the responsibility of the "host" express app
      // to bind to a port in this case
      return
    }

    const expressApp = express()

    console.log('> Setting up routes: ')

    const isoRoute = iso<Route<any>>()

    for (const route of this.routes) {
      const { method, rawPath, handler } = isoRoute.unwrap(route)

      console.log('Route: ' + method.toUpperCase() + ' ' + rawPath)

      expressApp[method](rawPath, handler)
    }

    expressApp.listen(port, cb)
  }
}


export type Flecha<R extends Route<any>> = Flecha_<R>

export const flecha = () => new Flecha_([])


