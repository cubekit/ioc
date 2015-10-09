import IoCContainer from 'IoC/'
import { mustBeInstantiable } from 'TestUtils/'


describe('IoCContainer', () => {

    mustBeInstantiable(IoCContainer)

    class Bar {}
    class Baz {}
    class Foo {
        static __cubekitMeta__ = {
            constructor: { types: [Bar, Baz] }
        }

        constructor(bar, baz) {
            this.bar = bar
            this.baz = baz
        }
    }

    it('must automatically inject deps to the constructor', () => {
        const ioc = new IoCContainer
        const foo = ioc.make(Foo)
        expect(foo.bar).to.be.an.instanceof(Bar)
        expect(foo.baz).to.be.an.instanceof(Baz)
    })

    it('must support singletons', () => {
        const ioc = new IoCContainer
        ioc.singleton(Bar)

        const foo1 = ioc.make(Foo)
        const foo2 = ioc.make(Foo)
        expect(foo1.bar).to.be.equal(foo2.bar)
    })

    it('must support singletons which flagged in the meta', () => {
        const ioc = new IoCContainer
        Bar.__cubekitMeta__ = { useAsSingleton: true }

        const foo1 = ioc.make(Foo)
        const foo2 = ioc.make(Foo)
        expect(foo1.bar).to.be.equal(foo2.bar)

        delete Bar.__cubekitMeta__
    })
})