import { ok, err, combine, Result } from 'neverthrow'



// https://stackoverflow.com/questions/50374908/transform-union-type-to-intersection-type
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void)
    ? I
    : never


type NonEmptyArray<T> = [T, ...T[]]


type PathParseError = 'path_parse_error'


interface PathParser<T extends string | number, P extends string> {
  tag: 'path_parser'
  path_name: P,
  fn: (raw: RawPathParams) => Result<T, PathParseError>
}


interface ParsedPathPart {
  [x: string]: string | number
}


type RawPathParams = Record<string, undefined | string>

type PathParserVariation = PathParser<string, any> | PathParser<number, any>


type ExtractUrlPathParams<T extends UrlPathParts[number]> =
  T extends PathParser<infer U, string>
    ? { [K in T['path_name']]: U } 
    : { }


export type GetParsedParams<U extends UrlPathParts> = UnionToIntersection<ExtractUrlPathParams<U[number]>>

export type UrlPathParts = NonEmptyArray<string | PathParserVariation>





export const getRawPathFromUrlPathParts = (parts: UrlPathParts): string => {
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




// alternative to using `as const`
// use this to ensure ExtractUrlPathParams works
// additionally, wrap UrlPath to prevent users from passing in a array literal into `route`
export const path = <U extends UrlPathParts>(path: U): { tag: 'url_path', path: U } => ({
  tag: 'url_path',
  path,
}) 


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

        // Checking for the following situation:
        // parseInt('123auiwe8923') -> 123
        if (parsedInteger.toString().length !== pathParam.length) {
          return err('path_parse_error')
        }

        return ok(parsedInteger)
      }

      return err('path_parse_error')
    }
  }
}




const partsListIntoCombinedParts = <T extends UrlPathParts>(
  list: ParsedPathPart[]
): GetParsedParams<T> =>
  list.reduce((partsObject, part) => {
    return {
      // need to dangerously cast this value for now:
      // https://github.com/Microsoft/TypeScript/issues/10727
      ...partsObject as any,
      ...part,
    }
  }, {} as unknown as GetParsedParams<T>)




export const parseUrlPath = <T extends UrlPathParts>(
  pathParts: T,
  rawPathParams: RawPathParams
): Result<GetParsedParams<T>, 'path_parse_error'> => {
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
