import { type PaginatedDocs } from 'payload'

// For hasMany select fields, T is an array (e.g. ('admin' | 'editor')[] | null).
// Payload supports `equals` on individual elements at runtime, so we widen accordingly.
// NonNullable strips null/undefined before the array check; tuple wrapping prevents
// union distribution.
type OrElement<T> = [NonNullable<T>] extends [(infer U)[]] ? T | U : T
type InArray<T> = [NonNullable<T>] extends [(infer U)[]] ? U[] : T[]

export type WhereOperators<T = any> = {
  equals?: OrElement<T>
  not_equals?: OrElement<T>
  greater_than?: T
  greater_than_equal?: T
  less_than?: T
  less_than_equal?: T
  like?: string
  contains?: OrElement<T>
  in?: InArray<T>
  not_in?: InArray<T>
  all?: InArray<T>
  exists?: boolean
}

type WhereFieldConstraints<T> = {
  [K in keyof T]?: T[K] extends object
    ? WhereFieldConstraints<T[K]> | WhereOperators<T[K]>
    : WhereOperators<T[K]> | T[K]
}

type DotPathFields = {
  [key: `${string}.${string}`]: WhereOperators
  [key: `${string}.${string}.${string}`]: WhereOperators
}

export type WhereCondition<T> = WhereFieldConstraints<T> &
  DotPathFields & {
    and?: WhereCondition<T>[]
    or?: WhereCondition<T>[]
  }

export type SelectFields<T> = {
  [K in keyof T]?: boolean
}

export type PopulateFields<
  TConfig extends { collections: Record<string, any> },
> = {
  [K in keyof TConfig['collections']]?: {
    [FK in keyof TConfig['collections'][K]]?: boolean
  }
}

export type PayloadQueryParams<
  TConfig extends { collections: Record<string, any> },
  T extends keyof TConfig['collections'] & string,
> = {
  collection: T
  where?: WhereCondition<TConfig['collections'][T]>
  limit?: number
  page?: number
  sort?: string | string[]
  depth?: number
  populate?: PopulateFields<TConfig>
  select?: SelectFields<TConfig['collections'][T]>
  pagination?: boolean
  draft?: boolean
  locale?: string
  fallbackLocale?: string
  joins?: Record<string, any>
}

export type PayloadQueryResponse<
  TConfig extends { collections: Record<string, any> },
  T extends keyof TConfig['collections'] & string,
> = {
  status: number
  message: string
  data: PaginatedDocs<TConfig['collections'][T]>
}
