'use strict'

const StateMachine = require('../lib/StateMachine')

function Client (url) {
  const _url = url
  const _transitionTable = {
    initial: 'disconnected',
    transitions: [
      {ev: 'connect', from: 'disconnected', to: 'connecting'},
      {ev: '_connectDone', from: 'connecting', to: 'connected'},
      {ev: 'disconnect', from: 'connected', to: 'disconnecting'},
      {ev: '_disconnectDone', from: 'disconnecting', to: 'disconnected'}
    ]
  }

  async function onConnecting () {
    console.log(`Client: connecting to ${_url}`)
    // Instead of really connecting we simulate it here
    await new Promise(resolve => setTimeout(resolve, 1000))
    this._connectDone()
  }

  async function onDisconnecting () {
    console.log(`Client: disconnecting from ${_url}`)
    // Instead of really disconnecting we simulate it here
    await new Promise(resolve => setTimeout(resolve, 1000))
    this._disconnectDone()
  }

  return Object.assign(StateMachine(_transitionTable), {
    onConnecting,
    onDisconnecting
  })
}

module.exports = Client
