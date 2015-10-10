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

        it('must merge types from the parent class', function() {
            const { meta } = this

            @meta.types(Type1)
            class ParentClass {}

            @meta.types(Type2)
            class ChildClass extends ParentClass {}

            checkMetaTypes(ChildClass, [Type1, Type2])
        })

        it('must not change types in the parent class', function() {
            const { meta } = this

            @meta.types(Type1)
            class ParentClass {}

            @meta.types(Type2)
            class ChildClass extends ParentClass {}

            checkMetaTypes(ParentClass, [Type1])
        })
    })
})