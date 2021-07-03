export type DataIntegrityError
  = { error: 'DataIntegrityError', context?: string }


export type RouteError =
  | { type: 'NotFound'; context?: string }
  | { type: 'Conflict'; context?: string }
  | { type: 'Other'; error?: Error; context: string }
  | { type: 'MissingHeader' }
  | { type: 'InvalidToken' }
  | { type: 'InvalidSession' }
  | { type: 'Forbidden' }
  | { type: 'BadRequest'; context: string }

export const notFound = (context?: string): RouteError => ({
  type: 'NotFound',
  context,
})

export const conflict = (context?: string): RouteError => ({
  type: 'Conflict',
  context,
})


export const other = (context: string, error?: Error): RouteError => ({
  type: 'Other',
  context,
  error,
})

export const missingHeader = (): RouteError => ({
  type: 'MissingHeader',
})

export const invalidToken = (): RouteError => ({
  type: 'InvalidToken',
})

export const invalidSession = (): RouteError => ({
  type: 'InvalidSession',
})

export const badRequest = (context: string): RouteError => ({
  type: 'BadRequest',
  context,
})

export const forbidden = (): RouteError => ({
  type: 'Forbidden'
})

export default {
  notFound,
  conflict,
  other,
  missingHeader,
  invalidToken,
  invalidSession,
  badRequest,
  forbidden,
}

