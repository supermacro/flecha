import { path, int, str, parseUrlPath } from '../src/url-path-parsers'

describe('Url Parsing Logic (pathParams)', () => {
  describe('Success cases', () => {
    it('Successfully parses params with no dynamic path parts', () => {
      const rawPathParams = {}

      const urlPath = path([ 'hello', 'world' ])

      const parseResult = parseUrlPath(
        urlPath.path,
        rawPathParams,
      )

      expect(parseResult._unsafeUnwrap()).toEqual({})
    })

    it('Successfully parses params with integer path part', () => {
      const rawPathParams = {
        userId: '12345',
      }

      const urlPath = path([ 'users', int('userId') ])

      const parseResult = parseUrlPath(
        urlPath.path,
        rawPathParams,
      )

      expect(parseResult._unsafeUnwrap()).toEqual({ userId: 12345 })
    })

    it('Successfully parses params with string path part', () => {
      const rawPathParams = {
        username: '@dodo',
      }

      const urlPath = path([ 'users', str('username') ])

      const parseResult = parseUrlPath(
        urlPath.path,
        rawPathParams,
      )

      expect(parseResult._unsafeUnwrap()).toEqual({ username: '@dodo' })
    })

    it('Successfully parses params with both string and int path parts', () => {
      const rawPathParams = {
        userId: '123456',
        householdId: 'cks52c26a00009c0y5f16fy9z',
      }

      const urlPath = path([
        'users',
        int('userId'),
        'households',
        str('householdId'),
      ])

      const parseResult = parseUrlPath(
        urlPath.path,
        rawPathParams,
      )

      expect(parseResult._unsafeUnwrap()).toEqual({
        userId: 123456,
        householdId: 'cks52c26a00009c0y5f16fy9z',
      })
    })
  })

  describe('Failure Cases', () => {
    it('Rejects invalid integer value in url path', () => {
      const rawPathParams = {
        userId: '1289ads8922',
      }

      const urlPath = path([ 'users', int('userId') ])

      const parseResult = parseUrlPath(
        urlPath.path,
        rawPathParams,
      )

      expect(parseResult.isErr()).toBe(true)
    })
  })
})

