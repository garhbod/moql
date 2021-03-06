const { setMock, unusedMocks, resetMocks } = require('./mocks')
let { app } = require('./app')

let server
const dynamicPort = 0

// Start the MoQL server, and return a Promise so you can wait on it.
// E.g. in JEST beforeAll will wait:
//
//   beforeAll(startMoQL)
//   beforeAll(() => startMoQL({ port: 7332 })) // custom port
//
exports.startMoQL = ({ port } = {}) =>
  new Promise((resolve, reject) => {
    const p = port || dynamicPort
    const s = app()
      .listen(p, () => {
        server = s // only set global if it actually started
        resolve(s.address().port)
      })
      .on('error', err => {
        console.error(`📈 moQL server failed to start on ${p}.`, err.message)
        reject()
      })
  })

// ✨ The main function. Register a mocked GraphQL query with MoQL.
//
//   request: {
//     query: "{}",               // GraphQL query to mock
//     variables: { foo: "bar" }, // variables to mock (optional if none)
//   },
//   response: {
//     data: { ... } // JSON graphql response your client expects
//   }
//
exports.moQL = ({ request, response }) => {
  let { query, variables } = request
  if (variables === undefined) variables = {} // strict by default
  if (!query) throw '👻 moQL missing query!'
  if (query === '{}') throw '🕳 moQL empty query!'

  const duplicate = setMock(query, variables)(response)
  if (duplicate) throw `🙅🙅 Duplicate moQL query! '${duplicate}'`
}

// Reset the MoQL mocks to a clean slate. Ideally run this after every spec.
// Optional, but you'll get tightly coupled specs and confusing results without.
exports.resetMoQL = () => resetMocks()

// Verify all mocks specified were used. Ideally run this after every spec.
// Optional, but useful to ensure specs don't acrue unused mocks.
// Because this is test framework agnosic it just returns an array;
// when empty it's good, when it has stuff in it those are the unused queries.
// This also calls `resetMoQL()` as it doesn't make sense not to when verifying.
//
//   verifyMoQL.length === 0 // pass
//
// Changed my mind it throws now.
exports.verifyMoQL = ({ reset } = { reset: true }) => {
  const unused = unusedMocks()
  if (unused) throw `😰 MoQL query not used! '${unused}'`
  if (reset) exports.resetMoQL() // to be helpful, unless you don't want that
}

// Stop the MoQL server. Not sure if this is necessary.
exports.stopMoQL = () =>
  new Promise(resolve => {
    server.close(() => resolve())
  })
