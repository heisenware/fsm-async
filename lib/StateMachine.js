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
class StateMachine extends EventEmitter {

  constructor (params) {
    super()
    this._state = params.initial
    this._transitions = params.transitions
    this._allowedStates = new Map()
    this._init()
  }

  /**
   * A function callback informing about state changes
   *
   * @callback callback This callback is triggered asynchronously on state change
   * @param {string} The current state the machine is in
   */
  onStateChange (callback) {
    this.on('state', callback)
  }

  /**
   * A function callback informing about invalid event triggers
   * @callback callback Called if an invalid event was triggered
   * @param {string} Name of the (invalid) event causing this callback
   * @param {string} Name of the current state the machine is in
   */
  onInvalidTransition (callback) {
    this.on('invalidTransition', callback)
  }

  /**
   * Return the current state of the machine
   *
   * @return {string} The current state of the machine
   */
  getState () {
    return this._state
  }

  /**
   * Allows asynchronous waiting for a state to enter
   *
   * @param {*} state Name of the state to wait for
   * @param {*} timeout Number of milliseconds after to wait (0 = forever)
   *
   * Note: The function will throw an Error if the timeout is reached
   */
  async waitUntilStateEnters (state, timeout = 0) {
    if (state === this._state) return
    const stateUpdate = new Promise((resolve, reject) => {
      this.on('state', (incomingState) => {
        if (incomingState === state) resolve()
      })
    })
    if (timeout > 0) await this._timeout(stateUpdate, timeout)
    else await stateUpdate
  }

  /**
   * Allows asynchronous waiting for a state to leave
   *
   * @param {*} state Name of the state to wait for
   * @param {*} timeout Number of milliseconds after to wait (0 = forever)
   *
   * Note: The function will throw an Error if the timeout is reached
   */
  async waitUntilStateLeaves (state, timeout = 0) {
    if (state !== this._state) return
    const stateUpdate = new Promise((resolve, reject) => {
      this.on('state', (incomingState) => {
        if (incomingState !== state) resolve()
      })
    })
    if (timeout > 0) await this._timeout(stateUpdate, timeout)
    else await stateUpdate
  }

  _timeout (promise, ms) {
    // Create a promise that rejects in <ms> milliseconds
    const timeout = new Promise((resolve, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id)
        reject(new Error('operation timed out'))
      }, ms)
    })
    // Returns a race between our timeout and the passed in promise
    return Promise.race([promise, timeout])
  }

  _init () {
    for (const row of this._transitions) {
      const onTo = row.to ? this._renameToCallback(row.to) : null
      const onEv = this._renameToCallback(row.ev)
      if (onTo && !this[onTo]) this[onTo] = () => {}
      if (this._allowedStates.has(row.ev)) {
        this._allowedStates.get(row.ev).push(row.from)
      } else {
        this._allowedStates.set(row.ev, [row.from])
      }
      // Generate the implementation of the event-function body
      this[row.ev] = async (...args) => {
        // Check whether event is allowed in current state
        if (this._allowedStates.get(row.ev).includes(this._state) || row.from === '*') {
          // Update internal state
          this._state = row.to
          // Await the on<event> and on<state> internal overrides
          if (this[onEv]) await this[onEv](...args)
          if (this[onTo]) await this[onTo](...args)
          // Notify all listeners for a new state (but only *after* the internal functions!)
          this.emit('state', this._state, ...args)
        } else {
          // Notify about invalid transition
          this.emit('invalidTransition', row.ev, this._state)
        }
      }
    }
    // Notify about reaching the initial state
    this.emit('state', this._state)
  }

  _renameToCallback (funcName) {
    if (funcName.charAt(0) === '_') {
      return '_on' + funcName.charAt(1).toUpperCase() + funcName.slice(2)
    }
    return 'on' + funcName.charAt(0).toUpperCase() + funcName.slice(1)
  }
}

module.exports = StateMachine
