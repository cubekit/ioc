import IoCContainer from 'ioc/'
import { mustBeInstantiable } from 'test-utils/'


describe('IoCContainer', function() {

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

    beforeEach(function(){
        this.ioc = new IoCContainer
    })

    it('must automatically inject deps to the constructor', function() {
        const foo = this.ioc.make(Foo)
        expect(foo.bar).to.be.an.instanceof(Bar)
        expect(foo.baz).to.be.an.instanceof(Baz)
    })

    it('must support singletons', function() {
        this.ioc.singleton(Bar)
        const foo1 = this.ioc.make(Foo)
        const foo2 = this.ioc.make(Foo)
        expect(foo1.bar).to.be.equal(foo2.bar)
    })

    it('must support singletons which flagged in the meta', function() {
        Bar.__cubekitMeta__ = { useAsSingleton: true }

        const foo1 = this.ioc.make(Foo)
        const foo2 = this.ioc.make(Foo)
        expect(foo1.bar).to.be.equal(foo2.bar)

        delete Bar.__cubekitMeta__
    })
})