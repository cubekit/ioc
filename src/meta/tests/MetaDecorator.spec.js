import MetaDecorator from 'meta/MetaDecorator'


describe('meta/MetaDecorator', () => {

    beforeEach(function() {
        this.meta = new MetaDecorator
    })

    describe('#types', function() {

        class Type1 {}
        class Type2 {}

        function checkMetaTypes(Class, expectedTypes) {
            expect(Class.__cubekitMeta__.constructor.types).to.eql(expectedTypes)
        }

        it('must correctly decorate a class', function() {
            const { meta } = this

            @meta.types(Type1, Type2)
            class Test {}

            checkMetaTypes(Test, [Type1, Type2])
        })

        it('must merge types if called more than once', function() {
            const { meta } = this

            @meta.types(Type2)
            @meta.types(Type1)
            class Test {}

            checkMetaTypes(Test, [Type1, Type2])
        })
    })
})