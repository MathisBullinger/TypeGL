import GLClass from './glBaseClass'
import oneOf from 'froebel/oneOf'
import type ShaderProgram from './program'
import type { GL } from './types'

export default class Uniform<T extends GL.TypeName> extends GLClass {
  private readonly handle: WebGLUniformLocation

  constructor(
    private readonly program: ShaderProgram,
    private readonly name: string,
    public readonly type: T
  ) {
    super(`Uniform{${name}}`)
    const assert = this.assert('constructor')

    this.handle = assert(
      program.getUniformLocation(name),
      `couldn't get location for uniform "${name}"`
    )

    assert(
      (this.info.type === this.typeId(this.type),
      `expected type ${this.type} but got ${this.typeName(this.info.type)}`)
    )
  }

  public set(...args: SetArgs<T>) {
    this.log('set')(...args)
    this.glSetter(this.handle, ...(args as any[]))
  }

  public get glSetter() {
    const assert = this.assert('glSetter')
    const [, type, dimensions] = assert(
      this.type.match(/^([A-Z]+)(?:_VEC([0-9]))?$/)
    )
    assert(oneOf(type, 'BOOL', 'INT', 'FLOAT'))
    const callName = `uniform${dimensions ?? 1}${
      type === 'FLOAT' ? 'f' : 'i'
    }` as GL.SetUniformCall
    assert(callName in this.program.gl)
    return this.program.gl[callName].bind(this.program.gl) as SetUniformSig<
      GL.GetSetUniform<T>
    >
  }

  private get info() {
    return this.assert('get info')(
      [...Array(this.program.activeUniformCount)]
        .map((_, i) => this.program.getActiveUniform(i))
        .find((info) => info?.name === this.name)
    )
  }
}

type SetArgs<T extends GL.TypeName> = Parameters<
  GL.Context[GL.GetSetUniform<T>]
> extends [any, ...infer R]
  ? R
  : never

type SetUniformSig<T extends GL.SetUniformCall> = GL.Context[T] extends (
  uniform: infer U,
  ...data: any[]
) => infer R
  ? (uniform: U, ...data: any[]) => R
  : never
