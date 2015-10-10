```


// AddItemToCartAction.js
import meta from 'app/meta'
import CartApi from 'app/api/cart'
import Storage from 'app/utils/storage'


@meta.types(CartApi, Storage)
class AddItemToCartAction {
    constructor(cartApi, storage) {
        this.cartApi = cartApi
        this.storage = storage
    }

    run(item) {
        this.cartApi.addItem(item).then(function(response) {
            this.storage.push('cart-state', response.state)
            return response
        })
    }
}


// CartApi.js
import meta from 'app/meta'


@meta.singleton()
@meta.types(Requester)
class CartApi {
    constructor(requester) {
        this.requester = requester
    }

    addItem(item) {
        return this.requester.request(
            'common/cart/add-item',
            { item: item }
        )
    }
}

// Requester.js
import meta from 'app/meta'


@meta.singleton()
class Requester {
    // some app-common request stuff
}

// somewhere in the app

import ioc from 'app/ioc'
import AddItemToCartAction from 'app/actions/AddItemToCartAction'

// ...

const action = ioc.make(AddItemToCartAction)
action.run()
```