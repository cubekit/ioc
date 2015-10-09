export default class MetaDecorator {
    types(...types) {
        return (Class) => {
            const meta = this._getOrCreateMeta(Class)
            meta.constructor.types.push(...types)
        }
    }

    _getOrCreateMeta(Class) {
        if (!Class.__cubekitMeta__) {
            Class.__cubekitMeta__ = {
                useAsSingleton: false,
                constructor: {
                    types: [],
                }
            }
        }
        return Class.__cubekitMeta__
    }
}