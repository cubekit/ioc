# Cubekit IoC

```es6
import { IoCContainer } from 'cubekit-ioc'
import { MetaDecorator } from 'cubekit-meta'


const meta = new MetaDecorator

class Storage {}
class Config {}
class Fetcher {}

// This decorator does not replaces the class, just adds
// a flag to the __cubekitMeta__ static property, so you
// are able to test it without problems.
@meta.singleton()
class Es6Fetcher {
  fetch(...args) {
    return fetch(...args)
  }
}

@meta.singleton()
@meta.types(Fetcher, Storage, Config)
class Api {
  
  constructor(fetcher, storage, config) {
    this.fetcher = fetcher
    this.storage = storage
    this.config = config
  }
  
  request(path, body) {
    const url = `${this.config.baseUrl}/${path}`
    const sessionKey = this.storage.getItem('sessionKey')
    return this.fetcher.fetch(url, {
      body,
      headers: { 'X-Session': sessionKey },
    })
  }
}

@meta.singleton()
@meta.types(Api)
class CartApiUtils {
  constructor(api) {
    this.api = api
  }
  
  addItem(item) {
    return this.api.request('cart/add-item', { item })
  }
}

const ioc = new IoCContainer

// Bind some specific class to an "interface"
ioc.bind(Fetcher, Es6Fetcher)

// Define singleton and set its instance at the same time
ioc.instance(Storage, localStorage)
ioc.instance(Config, {
  baseUrl: 'http://example.com/api/v1',
})

// Instantiate CartApiUtils. All deps will be recursively resolved by the ioc
const cartUtils = ioc.resolve(CartApiUtils)
cartUtils.addItem({ name: 'apple', qty: 1 })
```
