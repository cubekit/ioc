import _ from 'lodash'
import { Map } from 'immutable'


export default class IoCContainer {

    _singletons = new Map
    _instances = new Map

    singleton(type) {
        this._singletons = this._singletons.set(type, true)
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
            this._instances = this._instances.set(type, this._instantiate(type))
        }
        return this._instances.get(type)
    }

    _instantiate(type, args = []) {
        const deps = this.makeDeps(type, args)
        return new type(...deps)
    }

    makeDeps(type, args) {
        const types = this.getConstructorTypes(type, args)
        const count = Math.max(types.length, args.length)
        return _.times(count, (index) => {
            return args[index] || this.make(types[index])
        })
    }

    getConstructorTypes(type) {
        return _.get(type.__cubekitMeta__, 'constructor.types') || []
    }
}