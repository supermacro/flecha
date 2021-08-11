import {
  path,
  Route,
  noBody,
  okAsync,
} from '../../../../src/index'

export const emptyBody = Route.post(
  path([ 'empty-body' ]),
  noBody(),
  () => okAsync({ data: null })
)

