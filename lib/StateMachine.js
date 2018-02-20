'use strict'

const EventEmitter = require('events')

/**
 * Provides state machine functionality to your class.
 *
 * @param {Object} params Information about inner logic of the state machine.
 * @param {string} params.initial Initial state of the machine.
 * @param {Array} params.transitions Array representing rows of a transition table.
 * @param {string} params.transitions[n].ev Name of the event.
 * @param {string} params.transitions[n].from Name of the source state.
 * @param {string} params.transitions[n].to Name of the target state.
 */
function StateMachine (params) {
  let _state = params.initial
  let _events
  const _transitions = params.transitions
  const _allowedStates = new Map()
  const _eventEmitter = new EventEmitter()

  /**
   * A function callback informing about state changes
   *
   * @callback callback This callback is triggered asynchronously on state change
   * @param {string} The current state the machine is in
   */
  function onStateChange (callback) {
    _eventEmitter.on('state', callback)
  }

  /**
   * A function callback informing about invalid event triggers
   * @callback callback Called if an invalid event was triggered
   * @param {string} Name of the (invalid) event causing this callback
   * @param {string} Name of the current state the machine is in
   */
  function onInvalidTransition (callback) {
    _eventEmitter.on('invalidTransition', callback)
  }

  /**
   * Return the current state of the machine
   *
   * @return {string} The current state of the machine
   */
  function getState () {
    return _state
  }

  /**
   * Allows asynchronous waiting for a state to enter
   *
   * @param {*} state Name of the state to wait for
   * @param {*} timeout Number of milliseconds after to wait (0 = forever)
   *
   * Note: The function will throw an Error if the timeout is reached
   */
  async function waitUntilState (state, timeout = 0) {
    if (state === _state) return
    let stateUpdate = new Promise((resolve, reject) => {
      _eventEmitter.on('state', (state) => {
        if (state === _state) resolve()
      })
    })
    if (timeout > 0) await _timeout(stateUpdate, timeout)
    else await stateUpdate
  }

  function _timeout (promise, ms) {
    // Create a promise that rejects in <ms> milliseconds
    const timeout = new Promise((resolve, reject) => {
      let id = setTimeout(() => {
        clearTimeout(id)
        reject(new Error('operation timed out'))
      }, ms)
    })
    // Returns a race between our timeout and the passed in promise
    return Promise.race([promise, timeout])
  }

  function _renameToCallback (funcName) {
    if (funcName.charAt(0) === '_') {
      return '_on' + funcName.charAt(1).toUpperCase() + funcName.slice(2)
    }
    return 'on' + funcName.charAt(0).toUpperCase() + funcName.slice(1)
  }

  function _init () {
    _events = {}
    for (let row of _transitions) {
      const onTo = row.to ? _renameToCallback(row.to) : null
      const onEv = _renameToCallback(row.ev)
      if (onTo && !_events[onTo]) _events[onTo] = () => {}
      if (_allowedStates.has(row.ev)) {
        _allowedStates.get(row.ev).push(row.from)
      } else {
        _allowedStates.set(row.ev, [row.from])
        _events[onEv] = () => {}
      }
      // Generate the implementation of the event-function body
      _events[row.ev] = async (...args) => {
        // Check whether event is allowed in current state
        if (_allowedStates.get(row.ev).includes(_state) || row.from === '*') {
          // Update internal state
          _state = row.to
          // Notify all listeners for a new state
          _eventEmitter.emit('state', _state)
          // Await the on<event> and on<state> internal overrides
          await _events[onEv](...args)
          if (onTo) await _events[onTo](...args)
        } else {
          // Notify about invalid transition
          _eventEmitter.emit('invalidTransition', row.ev, _state)
        }
      }
    }
    // Notify about reaching the initial state
    _eventEmitter.emit('state', _state)
  }

  _init()

  return Object.assign(_events, {
    getState,
    onInvalidTransition,
    onStateChange,
    waitUntilState
  })
}

module.exports = StateMachine
