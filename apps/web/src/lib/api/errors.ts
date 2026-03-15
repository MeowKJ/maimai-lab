export type ApiProvider = 'lxns' | 'fish'

export type ApiErrorCode =
  | 'NOT_FOUND'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'UPSTREAM'
  | 'NETWORK'
  | 'CONFIG'
  | 'UNKNOWN'

export class ApiError extends Error {
  readonly name = 'ApiError'
  readonly provider: ApiProvider
  readonly code: ApiErrorCode
  readonly status?: number
  readonly details?: string

  constructor(args: {
    provider: ApiProvider
    code: ApiErrorCode
    message: string
    status?: number
    details?: string
  }) {
    super(args.message)
    this.provider = args.provider
    this.code = args.code
    this.status = args.status
    this.details = args.details
  }
}

