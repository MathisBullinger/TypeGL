import type { Fn } from 'froebel/types'

export namespace GL {
  export type Context = WebGLRenderingContext

  export type BaseType = Match<keyof Context, `@_VEC${number}`>
  export type TypeName = Extract<
    PickKeys<Context, number>,
    BaseType | `${BaseType}_${string}`
  >
  export type GetBaseType<T extends TypeName> = Extract<
    T | Match<T, `@_VEC${number}`>,
    BaseType
  >

  export type Call = PickKeys<Context, Fn>
  export type ProgramCall = CallAccepting<WebGLProgram>
  export type CallDef<T extends Call> = Context[T]
  export type Args<T extends Call> = Parameters<Context[T]>

  export type SetUniformCall = Extract<
    keyof Context,
    `uniform${number}${string}`
  >

  export type GetSetUniform<T extends GL.TypeName> = Extract<
    SetUniformCall,
    `uniform${Dimensions<T>}${UniformTypeAbbr<GetBaseType<T>>}`
  >

  type Dimensions<T extends TypeName> = T extends BaseType
    ? '1'
    : T extends `${BaseType}_VEC${infer D}`
    ? D
    : never

  type UniformTypeAbbr<T extends BaseType> = T extends 'FLOAT' ? 'f' : 'i'

  type CallAccepting<T> = PickKeys<Context, Fn<[T, ...any[]]>>
}

export type PickKeys<T, P> = {
  [K in keyof T]: T[K] extends P ? K : never
}[keyof T]

export type FnWrapper<F extends Fn, R = any> = Fn<
  ReturnType<F> extends void ? [] : [value: ReturnType<F>],
  R
>

export type Match<T extends string, P extends string> = T extends Replace<
  P,
  '@',
  `${infer I}`
>
  ? I
  : never

type Replace<
  S extends string,
  M extends string,
  R extends string
> = S extends `${infer H}${M}${infer T}` ? Replace<`${H}${R}${T}`, M, R> : S
