import type { GL } from './types'

const GLContext = WebGLRenderingContext

const glContextLookup: Record<GLenum, string> = Object.fromEntries(
  Object.entries(GLContext).map(([k, v]) => [v, k])
)

export const gl = {
  typeName: (typeId: GLenum) => glContextLookup[typeId] as GL.TypeName,
  typeId: (typeName: GL.TypeName) => (GLContext as any)[typeName] as GLenum,
  isTypeName: (type: GLenum | GL.TypeName): type is GL.TypeName =>
    typeof (GLContext as any)[type] === 'number',
}

export const indent = (text: string, spaces = 2) =>
  text
    .split('\n')
    .map((line) => ' '.repeat(spaces) + line)
    .join('\n')

export const assert = <T>(test: T, ...messages: unknown[]): Truthy<T> => {
  const msg = messages.map(String).join(' ') || 'assertion failed'
  if (!test) throw Error(msg)
  return test as Truthy<T>
}

export type Truthy<T> = Exclude<T, false | undefined | null | 0 | ''>
