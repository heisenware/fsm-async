'use strict'

const StateMachine = require('../lib/StateMachine')
const Client = require('./Client')

function Manager () {
  const _transitionTable = {
    initial: 'disabled',
    transitions: [
      {ev: 'enable', from: 'disabled', to: 'enabling'},
      {ev: '_enableDone', from: 'enabling', to: 'enabled'},
      {ev: 'disable', from: 'enabled', to: 'disabling'},
      {ev: '_disableDone', from: 'disabling', to: 'disabled'}
    ]
  }

  const client1 = Client('client1://host:port')
  const client2 = Client('client2://host:port')

  async function onEnabling () {
    console.log('Manager: enabling connections')
    await Promise.all([client1.connect(), client2.connect()])
    this._enableDone()
  }

  async function onDisabling () {
    console.log('Manager: disabling connections')
    await Promise.all([client1.disconnect(), client2.disconnect()])
    this._disableDone()
  }

  return Object.assign(StateMachine(_transitionTable), {
    onDisabling,
    onEnabling
  })
}

module.exports = Manager
