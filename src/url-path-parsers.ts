import { ok, err, Result } from 'neverthrow'


type NonEmptyArray<T> = [T, ...T[]]


type PathParseError = 'path_parse_error'


interface PathParser<T extends string | number, P extends string> {
  tag: 'path_parser'
  path_name: P,
  fn: (raw: RawPathParams) => Result<T, PathParseError>
}


export type RawPathParams = Record<string, undefined | string>

export type PathParserVariation = PathParser<string, any> | PathParser<number, any>


export type ExtractUrlPathParams<T extends UrlPathParts[number]> =
  T extends PathParser<infer U, string>
    ? { [K in T['path_name']]: U } 
    : { }


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
