'use strict'
/* global describe, it */

const StateMachine = require('../lib/StateMachine')

const chai = require('chai')
const assert = chai.assert

function TestClient () {
  const _transitionTable = {
    initial: 'disconnected',
    transitions: [
      {ev: 'connect', from: 'disconnected', to: 'connecting'},
      {ev: '_connectDone', from: 'connecting', to: 'connected'},
      {ev: 'disconnect', from: 'connected', to: 'disconnecting'},
      {ev: '_disconnectDone', from: 'disconnecting', to: 'disconnected'},
      {ev: 'goToA', from: '*', to: 'a'},
      {ev: 'goToB', from: '*', to: 'b'}
    ]
  }
  let _url

  async function init (url) {
    await this.connect(url)
  }

  async function onConnecting (url) {
    _url = url
    await new Promise(resolve => setTimeout(resolve, 500))
    this._connectDone()
  }

  async function onDisconnecting () {
    await new Promise(resolve => setTimeout(resolve, 500))
    this._disconnectDone()
  }

  function getUrl () {
    return _url
  }

  return Object.assign(StateMachine(_transitionTable), {
    onConnecting,
    onDisconnecting,
    getUrl,
    init
  })
}

describe(__filename, () => {
  let client = TestClient()
  let states = []
  let invalidTransition
  client.onStateChange((state) => {
    states.push(state)
  })
  client.onInvalidTransition((event, state) => {
    invalidTransition = [event, state]
  })

  describe('After instantiation', () => {
    it('the initial state should be set', () => {
      assert.equal(client.getState(), 'disconnected')
    })
  })
  describe('Provided transition table events', () => {
    it('should transform into callable functions', () => {
      assert.typeOf(client.connect, 'function')
      assert.typeOf(client.disconnect, 'function')
    })
  })
  describe('An awaited connect event', () => {
    const url = 'test://localhost:8080'
    it('should trigger two stateChanged callbacks', async () => {
      await client.init(url)
      assert.deepEqual(states, ['connecting', 'connected'])
      states = []
    })
    it('should have forwarded payload', () => {
      assert.equal(client.getUrl(), url)
    })
    it('should report proper state', () => {
      assert.equal(client.getState(), 'connected')
    })
    it('should trigger invalidTransition but no stateChanged callback if called again', async () => {
      await client.connect()
      assert.deepEqual(['connect', 'connected'], invalidTransition)
      assert.deepEqual([], states)
    })
    describe('A non-awaited disconnect event', () => {
      it('should trigger one stateChange callback at first', () => {
        client.disconnect()
        assert.deepEqual(['disconnecting'], states)
        assert.equal(client.getState(), 'disconnecting')
        states = []
      })
      it('connect should be possible once disconnected is reached', async () => {
        await client.waitUntilState('disconnected')
        assert.equal(client.getState(), 'disconnected')
        assert.deepEqual(['disconnected'], states)
        await client.connect()
        assert.equal(client.getState(), 'connected')
      })
    })
    describe('waitUntilState', () => {
      it('should throw exception if timeout is reached', async () => {
        client.disconnect()
        try {
          await client.waitUntilState('disconnected', 490)
          assert(false)
        } catch (err) {
          assert.equal(err.message, 'operation timed out')
        }
      })
    })
    describe('A "*" should allow event triggers from any state', () => {
      it('transit to state a and b should be possible', async () => {
        client.goToA()
        await client.waitUntilState('a')
        assert.equal(client.getState(), 'a')
        client.goToB()
        await client.waitUntilState('b')
        assert.equal(client.getState(), 'b')
      })
    })
  })
})
