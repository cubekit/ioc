export const mustBeInstantiable = (Class) => {

    it('Must be instantiable', () => new Class)
}