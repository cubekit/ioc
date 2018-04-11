import _ from 'lodash'
import { Map } from 'immutable'


export default class Container {

  _singletons = new Map
  _instances = new Map
  _bindings = new Map
  _resolvers = new Map
  _decorators = new Map
  _hooks = new Map
  _fakeFunctionCreator = null

  constructor(params = {}) {
    this.instance(Container, this)

    if (params.parent) {
      this._setParent(params.parent)
    }
  }

  setFakeFunctionCreator(createFakeFunction) {
    this._fakeFunctionCreator = createFakeFunction
  }

  /**
   * Make a "branch"-container from the current container.
   *
   * The new container inherits all singletons and instances
   * that was registered before the forking.
   *
   * Singletons and instances that will be registered after
   * the forking will not affect each other.
   *
   * ```js
   * const ioc = new Container
   *
   * ioc.singleton(Foo)
   *
   * const fork = ioc.fork()
   *
   * ioc.singleton(Bar)
   * fork.singleton(Baz)
   *
   * console.log(fork.make(Foo) == ioc.make(Foo))
   * console.log(fork.make(Bar) != ioc.make(Bar))
   * console.log(fork.make(Baz) != ioc.make(Baz))
   * ```
   *
   * @returns {Container}
   */
  fork() {
    return new Container({ parent: this })
  }

  singleton(Type, resolver = null) {
    this._singletons = this._singletons.set(Type, true)

    if (resolver) {
      this.bind(Type, resolver)
    }
  }

  instance(Type, instance) {
    this._validateType(Type)
    this.singleton(Type)
    this._setInstance(Type, instance)
  }

  bind(originalType, replacerType) {
    this._validateType(originalType)
    this._bindings = this._bindings.set(originalType, replacerType)
  }

  resolver(Type, resolver) {
    this._resolvers = this._resolvers.set(Type, resolver)
  }

  decorator(Type, decorate) {
    if (this._resolvers.has(Type)) {
      throw new Error(
        `You are trying to decorate resolver "${Type}" but it's not supported.` +
        'You can decorate only bindings and singletons.'
      )
    }

    this._validateType(Type)

    if (this._isSingleton(Type) && this._instances.has(Type)) {
      throw new Error(
        `You are trying to decorate an already instantiated singleton "${Type}".` +
        'This operation has no sense, probably something went wrong.'
      )
    }

    if (!this._decorators.has(Type)) {
      this._decorators = this._decorators.set(Type, [])
    }

    this._decorators.get(Type).push(decorate)
  }

  hook(Type, callback) {
    if (!this._hooks.has(Type)) {
      this._hooks = this._hooks.set(Type, [])
    }

    this._hooks.get(Type).push(callback)
  }

  resolve(Type, ...args) {
    if (this._resolvers.has(Type)) {
      return this._resolvers.get(Type)(...args)
    }

    if (_.isString(Type)) {
      if (!this._bindings.has(Type) && !this._instances.has(Type)) {
        throw new Error(
          `You are trying to instantiate a "${Type}" but ` +
          'it doesn\'t exist. Make sure that you\'ve registered ' +
          'it in and check the name for typos.'
        )
      }
    }

    this._validateType(Type)

    this._registerAsSingletonIfFlagged(Type)

    if (this._isInheritedSingleton(Type)) {
      return this._parent.make(Type)
    }

    if (this._isSingleton(Type)) {
      return this._getOrMakeSingletonInstance(Type)
    }

    return this._instantiate(Type, args)
  }

  walk(name, registry) {
    return this._hooks.get(name, []).reduce((registry, callback) => callback(registry), registry)
  }

  fake(Type) {
    const methods = {}
    const createFakeFunction = this._fakeFunctionCreator

    const mock = new Proxy({}, {
      get: function (target, key) {
        if (!methods[key]) {
          methods[key] = createFakeFunction()
        }

        return methods[key]
      },
    })

    this.resolver(Type, () => mock)
  }

  /**
   * @deprecated Use {@link Container#resolve} instead
   */
  make(...args) {
    return this.resolve(...args)
  }

  getSingletons() {
    return this._singletons
  }

  _registerAsSingletonIfFlagged(Type) {
    if (this._flaggedAsSingleton(Type)) {
      this.singleton(Type)
    }
  }

  _setParent(container) {
    this._parent = container
    this._inheritedSingletons = this._parent.getSingletons()
  }

  _flaggedAsSingleton(Type) {
    return _.get(Type.__cubekitMeta__, 'useAsSingleton')
  }

  /**
   * @param {*} Type
   * @returns {boolean}
   * @private
   */
  _isSingleton(Type) {
    return !!this._singletons.get(Type)
  }

  /**
   * Returns `true` if this container was forked from another,
   * and at the moment of the fork this `Type` was registered
   * as a singleton in the original container.
   *
   * @param {*} Type
   * @returns {boolean}
   * @private
   */
  _isInheritedSingleton(Type) {
    return !!(this._inheritedSingletons && this._inheritedSingletons.has(Type))
  }

  /**
   * @param {*} Type
   * @returns {*}
   * @private
   */
  _getOrMakeSingletonInstance(Type) {
    if (!this._instances.has(Type)) {
      this._setInstance(Type, this._instantiate(Type))
    }

    return this._instances.get(Type)
  }

  /**
   * Recursively instantiates the given type and all his deps.
   *
   * @param {*} Type
   * @param {Array<*>} args
   * @returns {*}
   * @private
   */
  _instantiate(Type, args = []) {
    const Binding = this._getBindingOrReturnType(Type)
    // this._validateBinding(Binding)

    const Decorated = this._decorate(Binding, Type)
    const deps = this._makeDeps(Decorated, args)
    return new Decorated(...deps)
  }

  /**
   * @param {*} Type
   * @param {Array<*>} args
   * @returns {Array}
   * @private
   */
  _makeDeps(Type, args) {
    const Types = this._getConstructorTypes(Type, args)
    const count = Math.max(Types.length, args.length)

    return _.times(count, (index) => {
      if (index < args.length) {
        return args[index]
      }

      return this.resolve(Types[index])
    })
  }

  /**
   * @param {*} Type
   * @returns {Array<*>}
   * @private
   */
  _getConstructorTypes(Type) {
    return _.get(Type.__cubekitMeta__, 'constructor.types') || []
  }

  /**
   * @param {*} Type
   * @returns {*}
   * @private
   */
  _getBindingOrReturnType(Type) {
    if (this._bindings.has(Type)) {
      return this._bindings.get(Type)
    }
    return Type
  }

  _decorate(Binding, Type) {
    if (this._decorators.has(Type)) {
      return this._decorators.get(Type).reduce((Binding, decorate) => {
        return decorate(Binding)
      }, Binding)
    }

    return Binding
  }

  /**
   * @param {*} Type
   * @param {*} instance
   * @private
   */
  _setInstance(Type, instance) {
    this._instances = this._instances.set(Type, instance)
  }

  _validateType(Type) {
    const typeOf = typeof Type

    if (typeOf !== 'string' && typeOf !== 'function') {
      throw new Error(
        `Either 'string' or 'function' must be used as type, but you passed ${Type}`
      )
    }
  }
}
