'use strict'

const StateMachine = require('../lib/StateMachine')

class Client extends StateMachine {

  constructor (url) {
    const transitionTable = {
      initial: 'disconnected',
      transitions: [
        { ev: 'connect', from: 'disconnected', to: 'connecting' },
        { ev: '_connectDone', from: 'connecting', to: 'connected' },
        { ev: 'disconnect', from: 'connected', to: 'disconnecting' },
        { ev: '_disconnectDone', from: 'disconnecting', to: 'disconnected' }
      ]
    }
    super(transitionTable)
    this._url = url
  }

  async onConnecting () {
    console.log(`Client: connecting to ${this._url}`)
    // Instead of really connecting we simulate it here
    await new Promise(resolve => setTimeout(resolve, 1000))
    this._connectDone()
  }

  async onDisconnecting () {
    console.log(`Client: disconnecting from ${this._url}`)
    // Instead of really disconnecting we simulate it here
    await new Promise(resolve => setTimeout(resolve, 1000))
    this._disconnectDone()
  }
}

module.exports = Client
