import _ from 'lodash'
import { Map } from 'immutable'


export default class Container {

    _singletons = new Map
    _instances = new Map
    _bindings = new Map

    constructor() {
        this.instance(Container, this)
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
        this.registerAsSingletonIfFlagged(Type)

        if (this._isSingleton(Type)) {
            return this._getSingleton(Type)
        }

        return this._instantiate(Type, args)
    }

    registerAsSingletonIfFlagged(Type) {
        if (this._flaggedAsSingleton(Type)) {
            this.singleton(Type)
        }
    }

    _flaggedAsSingleton(Type) {
        return _.get(Type.__cubekitMeta__, 'useAsSingleton')
    }

    _isSingleton(Type) {
        return !!this._singletons.get(Type)
    }

    _getSingleton(Type) {
        if (!this._instances.has(Type)) {
            this._setInstance(Type, this._instantiate(Type))
        }
        return this._instances.get(Type)
    }

    _instantiate(Type, args = []) {
        const deps = this._makeDeps(Type, args)
        const Binding = this._getBindingOrReturnType(Type)

        return new Binding(...deps)
    }

    _makeDeps(Type, args) {
        const Types = this._getConstructorTypes(Type, args)
        const count = Math.max(Types.length, args.length)

        return _.times(count, (index) => {
            return args[index] || this.make(Types[index])
        })
    }

    _getConstructorTypes(Type) {
        return _.get(Type.__cubekitMeta__, 'constructor.types') || []
    }

    _getBindingOrReturnType(Type) {
        if (this._bindings.has(Type)) {
            return this._bindings.get(Type)
        }
        return Type
    }

    _setInstance(Type, instance) {
        this._instances = this._instances.set(Type, instance)
    }
}
