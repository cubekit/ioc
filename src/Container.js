import _ from 'lodash'
import { Map } from 'immutable'


export default class Container {

    _singletons = new Map
    _instances = new Map
    _bindings = new Map

    constructor(params = {}) {
        this.instance(Container, this)

        if (params.parent) {
            this._setParent(params.parent)
        }
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

    singleton(Type) {
        this._singletons = this._singletons.set(Type, true)
    }

    instance(Type, instance) {
        this.singleton(Type)
        this._setInstance(Type, instance)
    }

    bind(originalType, replacerType) {
        this._bindings = this._bindings.set(originalType, replacerType)
    }

    make(Type, ...args) {
        this._registerAsSingletonIfFlagged(Type)

        if (this._isInheritedSingleton(Type)) {
            return this._parent.make(Type)
        }

        if (this._isSingleton(Type)) {
            return this._getOrMakeSingletonInstance(Type)
        }

        return this._instantiate(Type, args)
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
        return !! (this._inheritedSingletons && this._inheritedSingletons.has(Type))
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
        const deps = this._makeDeps(Binding, args)

        return new Binding(...deps)
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
            return args[index] || this.make(Types[index])
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

    /**
     * @param {*} Type
     * @param {*} instance
     * @private
     */
    _setInstance(Type, instance) {
        this._instances = this._instances.set(Type, instance)
    }
}
