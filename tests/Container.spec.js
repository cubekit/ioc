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

    it('must register itself as instance', function() {
        const ioc = this.ioc.resolve(IoCContainer)
        expect(ioc).to.be.equal(this.ioc)
    })

    it('must automatically inject deps to the constructor', function() {
        checkBarAndBaz(this.ioc.resolve(Foo))
    })

    it('must support singletons', function() {
        this.ioc.singleton(Bar)
        const foo1 = this.ioc.resolve(Foo)
        const foo2 = this.ioc.resolve(Foo)
        expect(foo1.bar).to.be.equal(foo2.bar)
    })

    it('must support the "useAsSingleton" flag in the meta', function() {
        Bar.__cubekitMeta__ = { useAsSingleton: true }

        const foo1 = this.ioc.resolve(Foo)
        const foo2 = this.ioc.resolve(Foo)
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

        const needsFoo = this.ioc.resolve(NeedsFoo)
        expect(needsFoo.foo).to.be.an.instanceof(Foo)
        checkBarAndBaz(needsFoo.foo)
    })

    it('must accept additional arguments', function() {
        class Class {
            constructor(...args) {
                this.args = args
            }
        }

        const instance = this.ioc.resolve(Class, 1, 2, 3)
        expect(instance.args).to.eql([1, 2, 3])
    })

    it('must not resolve dependency if it was passed as argument', function() {
        const bar = new Bar
        const foo = this.ioc.resolve(Foo, bar)
        expect(foo.bar).to.equal(bar)
    })

    it('must allow to partially pass deps as arguments', function() {
        const baz = new Baz
        const foo = this.ioc.resolve(Foo, null, baz)
        expect(foo.baz).to.equal(baz)
    })

    it('must allow to bind some another type to the given type', function() {
        class BarReplacement {}
        this.ioc.bind(Bar, BarReplacement)
        const foo = this.ioc.resolve(Foo)
        expect(foo.bar).to.be.an.instanceof(BarReplacement)
    })

    it('must get `deps` from the binded type', function() {
        class BarReplacement {
            static __cubekitMeta__ = {
                constructor: { types: [Baz] }
            }

            constructor(baz) {
                this.baz = baz
            }
        }

        this.ioc.bind(Bar, BarReplacement)
        const bar = this.ioc.resolve(Bar)
        expect(bar.baz).to.be.an.instanceof(Baz)
    })

    it('must set define a singleton and immediately set its instance', function() {
        const originalInstance = new Bar
        this.ioc.instance(Bar, originalInstance)
        const barInstance = this.ioc.resolve(Bar)
        expect(barInstance).to.be.equal(originalInstance)
    })

    it('throws if user tries to resolve a non-existent type', function() {
        const resolve = () => this.ioc.resolve('A non-existent type')

        expect(resolve).to.throw(/exist/)
    })

    it('does not throw if an instance with the given name exists', function() {
        this.ioc.instance('Some Unique Instance Name', {})

        const resolve = () => this.ioc.resolve('Some Unique Instance Name')

        expect(resolve).not.to.throw()
    })

    describe('#fork', function() {
        /**
         * `#fork` returns a copy of the container. Any classes
         * registered in the fork will not affect the original
         * container.
         */

        it('must not affect the original container', function() {
            const fork = this.ioc.fork()
            fork.instance(Foo, {})
            expect(this.ioc.resolve(Foo)).to.not.equal(fork.resolve(Foo))
        })

        it('must inherit instances from the original container', function() {
            this.ioc.instance(Foo, {})
            const fork = this.ioc.fork()
            expect(this.ioc.resolve(Foo)).to.equal(fork.resolve(Foo))
        })

        it('must share singletons defined in the ' +
            'original container before the forking', function() {

            this.ioc.singleton(Foo)
            const fork = this.ioc.fork()
            expect(fork.resolve(Foo)).to.equal(this.ioc.resolve(Foo))
        })

        it('must not share singletons defined in the ' +
            'original container after the forking', function() {

            const fork = this.ioc.fork()
            this.ioc.singleton(Foo)
            expect(fork.resolve(Foo)).to.not.equal(this.ioc.resolve(Foo))
        })
    })

    describe('Fakes', function() {
        it('can set up a fake resolver for the given type', function() {

            this.ioc.setFakeFunctionCreator(() => sinon.spy())
            this.ioc.fake('mock')

            const mock = this.ioc.resolve('mock')

            mock.foo('a', 'b', 'c')

            expect(mock.foo.calledWith('a', 'b', 'c')).to.be.ok
        })
    })

    describe('Resolvers', function() {
        it('uses resolver if it is defined', function() {
            this.ioc.resolver('foo', () => {
                return 'bar'
            })

            expect(this.ioc.resolve('foo')).to.eql('bar')
        })

        it('passes the given arguments to the resolver', function() {
            this.ioc.resolver('foo', (arg1, arg2) => {
                return arg1 + ' ' + arg2
            })

            expect(this.ioc.resolve('foo', 'Hello', 'World')).to.eql('Hello World')
        })

        it('supports singletons', function() {
            class Foo {}

            this.ioc.resolver('foo', (id) => {
                this.ioc.singleton(`foo.${id}`, Foo)

                return this.ioc.resolve(`foo.${id}`)
            })

            const result1 = this.ioc.resolve('foo')
            const result2 = this.ioc.resolve('foo')

            expect(result1 == result2).to.be.ok
        })
    })
})
