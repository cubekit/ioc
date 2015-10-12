import IoCContainer from 'Container'


describe('ioc/Container', function() {

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

    function checkBarAndBaz(foo) {
        expect(foo.bar).to.be.an.instanceof(Bar)
        expect(foo.baz).to.be.an.instanceof(Baz)
    }

    beforeEach(function() {
        this.ioc = new IoCContainer
    })

    it('must automatically inject deps to the constructor', function() {
        checkBarAndBaz(this.ioc.make(Foo))
    })

    it('must support singletons', function() {
        this.ioc.singleton(Bar)
        const foo1 = this.ioc.make(Foo)
        const foo2 = this.ioc.make(Foo)
        expect(foo1.bar).to.be.equal(foo2.bar)
    })

    it('must support the "useAsSingleton" flag in the meta', function() {
        Bar.__cubekitMeta__ = { useAsSingleton: true }

        const foo1 = this.ioc.make(Foo)
        const foo2 = this.ioc.make(Foo)
        expect(foo1.bar).to.be.equal(foo2.bar)

        delete Bar.__cubekitMeta__
    })

    it('must resolve the deps recursively', function() {
        class NeedsFoo {
            static __cubekitMeta__ = {
                constructor: { types: [Foo] }
            }
            constructor(foo) {
                this.foo = foo
            }
        }

        const needsFoo = this.ioc.make(NeedsFoo)
        expect(needsFoo.foo).to.be.an.instanceof(Foo)
        checkBarAndBaz(needsFoo.foo)
    })

    it('must accept additional arguments', function() {
        class Class {
            constructor(...args) {
                this.args = args
            }
        }

        const instance = this.ioc.make(Class, 1, 2, 3)
        expect(instance.args).to.eql([1, 2, 3])
    })

    it('must not resolve dependency if it was passed as argument', function() {
        const bar = new Bar
        const foo = this.ioc.make(Foo, bar)
        expect(foo.bar).to.equal(bar)
    })

    it('must allow to partially pass deps as arguments', function() {
        const baz = new Baz
        const foo = this.ioc.make(Foo, null, baz)
        expect(foo.baz).to.equal(baz)
    })

    it('must allow to bind some another type to the given type', function() {
        class BarReplacement {}
        this.ioc.bind(Bar, BarReplacement)
        const foo = this.ioc.make(Foo)
        expect(foo.bar).to.be.an.instanceof(BarReplacement)
    })

    it('must set define a singleton and immediately set its instance', function() {
        const originalInstance = new Bar
        this.ioc.instance(Bar, originalInstance)
        const barInstance = this.ioc.make(Bar)
        expect(barInstance).to.be.equal(originalInstance)
    })
})
