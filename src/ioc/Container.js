import _ from 'lodash'
import { Map } from 'immutable'


export default class IoCContainer {

    _singletons = new Map
    _instances = new Map
    _bindings = new Map

    singleton(type) {
        this._singletons = this._singletons.set(type, true)
    }

    instance(type, instance) {
        this.singleton(type)
        this._setInstance(type, instance)
    }

    bind(originalType, replacerType) {
        this._bindings = this._bindings.set(originalType, replacerType)
    }

    make(type, ...args) {
        this.registerAsSingletonIfFlagged(type)

        if (this._isSingleton(type)) {
            return this._getSingleton(type)
        }

        return this._instantiate(type, args)
    }

    registerAsSingletonIfFlagged(type) {
        if (this._flaggedAsSingleton(type)) {
            this.singleton(type)
        }
    }

    _flaggedAsSingleton(type) {
        return _.get(type.__cubekitMeta__, 'useAsSingleton')
    }

    _isSingleton(type) {
        return !! this._singletons.get(type)
    }

    _getSingleton(type) {
        if (!this._instances.has(type)) {
            this._setInstance(type, this._instantiate(type))
        }
        return this._instances.get(type)
    }

    _instantiate(type, args = []) {
        const deps = this._makeDeps(type, args)
        const binding = this._getBindingOrReturnType(type)
        return new binding(...deps)
    }

    _makeDeps(type, args) {
        const types = this._getConstructorTypes(type, args)
        const count = Math.max(types.length, args.length)
        return _.times(count, (index) => {
            return args[index] || this.make(types[index])
        })
    }

    _getConstructorTypes(type) {
        return _.get(type.__cubekitMeta__, 'constructor.types') || []
    }

    _getBindingOrReturnType(type) {
        if (this._bindings.has(type)) {
            return this._bindings.get(type)
        }
        return type
    }

    _setInstance(type, instance) {
        this._instances = this._instances.set(type, instance)
    }
}