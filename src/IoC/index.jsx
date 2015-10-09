import _ from 'lodash'
import { Map } from 'immutable'


export default class IoCContainer {

    _singletons = new Map
    _instances = new Map

    singleton(type) {
        this._singletons = this._singletons.set(type, true)
    }

    make(type) {
        this.registerAsSingletonIfFlagged(type)

        if (this._isSingleton(type)) {
            return this._getSingleton(type)
        }

        return this._instantiate(type)
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

    _instantiate(type) {
        const deps = this.makeDeps(type)
        return new type(...deps)
    }

    makeDeps(type) {
        const types = this.getConstructorTypes(type)
        return _.map(types, type => this.make(type))
    }

    getConstructorTypes(type) {
        return _.get(type.__cubekitMeta__, 'constructor.types') || []
    }
}