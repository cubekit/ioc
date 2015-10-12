var testContext = require.context('./tests', true, /.+\.spec\.js?$/)
testContext.keys().forEach(testContext)