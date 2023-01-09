import type { Fn } from 'froebel/types'
import * as debug from './debug'

export default abstract class GLClass {
  constructor(private readonly className: string) {
    this.bind(this)(this.prefixFn, this.typeName, this.typeId, this.formatList)
  }

  private prefixFn =
    <T extends (..._: any[]) => any>(fn: T) =>
    (method?: string): ReturnType<T> =>
      ((...args: any[]) => fn(this.prefix(method))(...args)) as any

  protected prefix(method?: string) {
    return `[${this.className}${method ? `.${method}` : ''}]:`
  }

  protected log = this.prefixFn(
    (prefix: string) =>
      (...args: unknown[]) =>
        console.log(prefix, ...args)
  )

  protected assert = this.prefixFn(
    (prefix: string) =>
      <T>(assertion: T, ...msgs: unknown[]) =>
        debug.assert(
          assertion,
          prefix,
          ...(msgs.length ? msgs : ['assertion failed'])
        )
  )

  protected bind =
    (context: unknown) =>
    (...methods: Fn[]) => {
      methods.forEach((method) => method.bind(context))
    }

  protected defineIf =
    <C extends boolean>(condition: C) =>
    <F>(method: F): true extends C ? F : never =>
      (condition ? method : undefined) as any

  protected typeName = debug.gl.typeName
  protected typeId = debug.gl.typeId
  protected isTypeName = debug.gl.isTypeName

  protected formatList(values: unknown[], type: 'and' | 'or' = 'or') {
    return new Intl.ListFormat(undefined, {
      type: type === 'and' ? 'conjunction' : 'disjunction',
    }).format(values.map(String))
  }
}
