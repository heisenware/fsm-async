# fsm-async

A state machine implementation featuring:

1.  `on<state>` life-cycle events. Allows triggering of further (inner) events
    during the callback.

2.  `async` event functions that can be awaited for. Depending
    on the implemented logic, a whole chain of state changes can be awaited.

3.  A generic and awaitable `waitUtilState(<state>)` function providing
    full flexibility to state machine clients business logic.

## Example

Define the transition table as a json object,

```javascript
const transitionTable = {
  initial: 'disconnected',
  transitions: [
    {ev: 'connect', from: 'disconnected', to: 'connecting'},
    {ev: '_connectDone', from: 'connecting', to: 'connected'},
    {ev: 'disconnect', from: 'connected', to: 'disconnecting'},
    {ev: '_disconnectDone', from: 'disconnecting', to: 'disconnected'}
  ]
}
```

then apply this logic to your object:

```javascript
const StateMachine = require('./StateMachine')

function MyClient () {
  const transitionTable = {
    initial: 'disconnected',
    transitions: [
      {ev: 'connect', from: 'disconnected', to: 'connecting'},
      {ev: '_connectDone', from: 'connecting', to: 'connected'},
      {ev: 'disconnect', from: 'connected', to: 'disconnecting'},
      {ev: '_disconnectDone', from: 'disconnecting', to: 'disconnected'}
    ]
  }
  return Object.assign(StateMachine(transitionTable))
}
```

This injects the events as proper callable functions to your instance,
hence you write:

```javascript
myClient = MyClient()
myClient.connect()
```

On the object itself you can define life-cycle functions `on<event>` and
`on<state>`, which will be automatically called and may fire further events:

```javascript
const StateMachine = require('./StateMachine')

function MyClient () {
  const transitionTable = {
    initial: 'disconnected',
    transitions: [
      {ev: 'connect', from: 'disconnected', to: 'connecting'},
      {ev: '_connectDone', from: 'connecting', to: 'connected'},
      {ev: 'disconnect', from: 'connected', to: 'disconnecting'},
      {ev: '_disconnectDone', from: 'disconnecting', to: 'disconnected'}
    ]
  }

  // Use async here to be able to await internally
  async function onConnecting () {
    // Simulate connection establishment
    await Promise.delay(1000)
    // Internally trigger an event bringing the machine to connected state
    this._connectDone()
  }

  async function onDisconnecting () {
    // Simulate disconnection
    await Promise.delay(1000)
    // Internally trigger an event bringing the machine to disconnected state
    this._disconnectDone()
  }

  return Object.assign(StateMachine(transitionTable), {
    onConnecting,
    onDisconnecting
  })
}
```

No outer code can `await` the `connect()` of your client and use other utility
functions injected by the `StateMachine`. The utility functions are:
1. `getState()` -> returns current state
2. `waitUntilState(<state>)` -> waits until a given state is reached
3. `onStateChange(<callback>)` -> notifies about state changes
4. `onInvalidTransition(<callback>)`-> notifies about invalid transitions

```javascript
myClient = MyClient()

myClient.onStateChange((state) => {
  console.log(`State changed to: ${state}`)
})

console.log(myClient.getState()) // disconnected
await myClient.connect()
console.log(myClient.getState()) // connected
myClient.disconnect()
console.log(myClient.getState()) // disconnecting
myClient.waitUntilState('disconnected')
console.log(myClient.getState()) // disconnected
```

Please see the provided example code for more details and usage patterns.






