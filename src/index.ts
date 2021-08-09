import { Result, ResultAsync, combine } from 'neverthrow'
import { RouteError } from './errors'
import {
  getRawPathFromUrlPathParts,
  ExtractUrlPathParams,
  PathParserVariation,
  RawPathParams,
  UrlPathParts,
} from './url-path-parsers'
import { z, ZodType } from 'zod'
import express, { Express, Request as XRequest, Response as XResponse } from 'express'
import { Newtype, iso } from 'newtype-ts'


export { path, int, str } from './url-path-parsers'



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

export interface Route<T> extends Newtype<{ readonly Route: unique symbol }, RouteInfo> {}




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
  | JSONObject
  | JSONValues[]

export interface JSONObject {
  [k: string]: JSONValues
}





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




// https://stackoverflow.com/questions/50374908/transform-union-type-to-intersection-type
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void)
    ? I
    : never










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



type ParsedUrlParts<T extends UrlPathParts> = UnionToIntersection<ExtractUrlPathParams<T[number]>>

interface ParsedPathPart {
  [x: string]: string | number
}


const partsListIntoCombinedParts = <T extends UrlPathParts>(
  list: ParsedPathPart[]
): ParsedUrlParts<T> =>
  list.reduce((partsObject, part) => {
    return {
      // need to dangerously cast this value for now:
      // https://github.com/Microsoft/TypeScript/issues/10727
      ...partsObject as any,
      ...part,
    }
  }, {} as unknown as ParsedUrlParts<T>)




const parseUrlPath = <T extends UrlPathParts>(
  pathParts: T,
  rawPathParams: RawPathParams
): Result<ParsedUrlParts<T>, 'path_parse_error'> => {
  const parseResults = pathParts.filter(
    (part): part is PathParserVariation => typeof part !== 'string'
  )
  .map((pathParser) => {
    return pathParser.fn(rawPathParams)
      .map((parsedValue) => {
        const pathName: string = pathParser.path_name

        const parsedPathPart: ParsedPathPart = {
          [pathName]: parsedValue,
        }

        return parsedPathPart
      })
  })
  
  return combine(parseResults).map(
    (list) => partsListIntoCombinedParts<T>(list)
  )
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



type GetParsedParams<U extends UrlPathParts> = UnionToIntersection<ExtractUrlPathParams<U[number]>>


const handleHandlerResult = <T>(
  handlerResult: RouteResult<T>,
  res: XResponse
): void => {
  handlerResult
    .map(({ data }) => {
      res.setHeader('Access-Control-Allow-Origin', '*')

      res.status(200).json({
        data,
      })
    })
    .mapErr((error) => {
      const { statusCode, errorMsg } = mapRouteError(error)
      res.status(statusCode).json({ error: errorMsg })
    })
}





const route = (method: Method) =>
  <T extends JSONValues, U extends UrlPathParts, B>(
    urlPathParser: { tag: 'url_path', path: U },
    bodyParser: Decoder<B>,
    handler: RouteHandler<T, GetParsedParams<U>, B>
  ) =>
    iso<Route<T>>().wrap({
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

        const pathParamsParseResult = parseUrlPath(
          urlPathParser.path,
          req.params,
        )

        if (pathParamsParseResult.isErr()) {
          res.status(400).json({
            error: 'Invalid url path',
          })

          return
        }

        const pathParams = pathParamsParseResult.value

        const handlerResult = handler({
          body: requestBodyDecodeResult.data,
          pathParams,
        })

        handleHandlerResult(handlerResult, res)
      }
    })


// Same as route, except there is no request body to be parsed
const simpleRoute = (method: Method) =>
  <T extends JSONValues, U extends UrlPathParts>(
    urlPathParser: { tag: 'url_path', path: U },
    handler: RouteHandler<T, GetParsedParams<U>, void>
  ) =>
    iso<Route<T>>().wrap({
      method,

      rawPath: getRawPathFromUrlPathParts(urlPathParser.path),

      handler: (req: XRequest, res: XResponse) => {
        const pathParamsParseResult = parseUrlPath(
          urlPathParser.path,
          req.params,
        )

        if (pathParamsParseResult.isErr()) {
          res.status(400).json({
            error: 'Invalid url path',
          })

          return
        }

        const pathParams = pathParamsParseResult.value

        const handlerResult = handler({
          body: undefined,
          pathParams,
        })

        handleHandlerResult(handlerResult, res)
      }
    })



export const Route = {
  get: simpleRoute('get'),
  put: route('put'),
  post: route('post'),
  delete: simpleRoute('delete'),
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
    const expressApp = this.expressAppHost
      ? this.expressAppHost
      : express()

    console.log('> Setting up routes: ')

    const isoRoute = iso<Route<any>>()

    for (const route of this.routes) {
      const { method, rawPath, handler } = isoRoute.unwrap(route)

      console.log('Route: ' + method.toUpperCase() + ' ' + rawPath)

      const shouldSkipJsonParsing = ['get', 'delete'].includes(method)

      if (shouldSkipJsonParsing) {
        expressApp[method](rawPath, handler)
      } else {
        expressApp[method](rawPath, express.json(), handler)
      }
    }

    if (this.expressAppHost) {
      // it's the responsibility of the "host" express app
      // to bind to a port in this case
      return
    }

    expressApp.listen(port, cb)
  }
}


export type Flecha<R extends Route<any>> = Flecha_<R>

export const flecha = () => new Flecha_([])


