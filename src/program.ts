import GLClass from './glBaseClass'
import Uniform from './uniform'
import oneOf from 'froebel/oneOf'
import pipe from 'froebel/pipe'
import type { Fn } from 'froebel/types'
import type { GL, FnWrapper } from './types'

export default class ShaderProgram<
  T extends UniformsDef = any
> extends GLClass {
  public readonly glProgram: WebGLProgram
  private uniforms: UniformMap<T> = {}

  constructor(
    public readonly gl: GL.Context,
    private readonly uniformTypes: T
  ) {
    super('Program')
    const assert = this.assert('constructor')
    this.glProgram = assert(gl.createProgram(), 'failed to create program')
  }

  public static from<U extends UniformsDef>(
    canvas: HTMLCanvasElement,
    uniforms: U
  ): ShaderProgram<U> {
    const context = canvas.getContext('webgl')
    if (!context) throw Error(`failed to create webgl context`)
    return new ShaderProgram(context, uniforms)
  }

  public attachShader(shaderType: GLenum, sourceCode: string) {
    const assert = this.assert('attachShader')

    const validTypes = [this.gl.VERTEX_SHADER, this.gl.FRAGMENT_SHADER]
    assert(
      oneOf(shaderType, ...validTypes),
      `shaderType must be either ${this.formatList(
        validTypes.map(this.typeName)
      )} but was ${this.typeName(shaderType)}`
    )
    assert(
      !this.isShaderAttached(shaderType),
      this.typeName(shaderType),
      'already attached'
    )

    const shader = assert(
      this.gl.createShader(shaderType),
      `failed to create`,
      this.typeName(shaderType)
    )
    this.gl.shaderSource(shader, sourceCode)
    this.gl.compileShader(shader)
    this.gl.attachShader(this.glProgram, shader)
  }

  public getUniform<U extends keyof T>(name: U): Uniform<T[U]> {
    const assert = this.assert('getUniform')
    const type: T[U] = assert(this.uniformTypes[name])
    return (this.uniforms[name] ??= new Uniform(this, name as string, type))
  }

  private isShaderAttached = (shaderType: GLenum) =>
    this.getAttachedShaders()
      .map((shader) => this.gl.getShaderParameter(shader, this.gl.SHADER_TYPE))
      .includes(shaderType)

  public get activeUniformCount(): number {
    return this.getProgramParameter(this.gl.ACTIVE_UNIFORMS) ?? 0
  }

  private bindProgram: BindProgram = (name) => {
    const instrument = (glc: Fn): BPInstrument<any, any> =>
      Object.assign<any, BPChained<any, any>>(glc, {
        return: (mapper) => instrument(pipe(glc, mapper as Fn)),
      })

    return instrument((...args: unknown[]) =>
      (this.gl[name] as any).call(this.gl, this.glProgram, ...args)
    )
  }

  public getUniformLocation = this.bindProgram('getUniformLocation')
  public getProgramParameter = this.bindProgram('getProgramParameter')
  public getActiveUniform = this.bindProgram('getActiveUniform')
  public link = this.bindProgram('linkProgram')
  public use = this.bindProgram('useProgram')
  private getAttachedShaders = this.bindProgram('getAttachedShaders').return(
    (v) => v ?? []
  )
}

type BindProgram = <C extends GL.ProgramCall>(
  name: C
) => BPInstrument<C, BoundProgramCall<C>>

type BPInstrument<C extends GL.ProgramCall, F extends Fn> = F & BPChained<C, F>

type BPChained<C extends GL.ProgramCall, F extends Fn> = {
  return: <R>(
    mapReturn: FnWrapper<F, R>
  ) => BPInstrument<C, BoundProgramCall<C, R>>
}

type BoundProgramCall<
  C extends GL.ProgramCall,
  RN = never
> = GL.CallDef<C> extends (program: WebGLProgram, ...args: infer A) => infer RP
  ? (...args: A) => [RN] extends [never] ? RP : RN
  : never

type UniformsDef = Record<string, GL.TypeName>
type UniformMap<T extends UniformsDef> = { [K in keyof T]?: Uniform<T[K]> }
