'use strict'

const StateMachine = require('../lib/StateMachine')
const Client = require('./Client')

class Manager extends StateMachine {

  constructor () {
    const transitionTable = {
      initial: 'disabled',
      transitions: [
        { ev: 'enable', from: 'disabled', to: 'enabling' },
        { ev: '_enableDone', from: 'enabling', to: 'enabled' },
        { ev: 'disable', from: 'enabled', to: 'disabling' },
        { ev: '_disableDone', from: 'disabling', to: 'disabled' }
      ]
    }
    super(transitionTable)

    this._client1 = new Client('client1://host:port')
    this._client2 = new Client('client2://host:port')
  }

  async onEnabling () {
    console.log('Manager: enabling connections')
    await Promise.all([this._client1.connect(), this._client2.connect()])
    this._enableDone()
  }

  async onDisabling () {
    console.log('Manager: disabling connections')
    await Promise.all([this._client1.disconnect(), this._client2.disconnect()])
    this._disableDone()
  }
}

module.exports = Manager
