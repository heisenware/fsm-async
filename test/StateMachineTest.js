'use strict'
/* global describe, it */

const chai = require('chai')
const assert = chai.assert
const TestClass = require('./fixtures/TestClass')

describe('A TestClass which extends StateMachine', () => {
  let testClass
  let invalidTransition = {}
  let seenStates = []
  const seenReasonAndStates = new Map()

  it('should properly instantiate', () => {
    testClass = new TestClass()
    assert.isObject(testClass)
  })

  describe('A TestClass instance', () => {
    it('should allow to register "onStateChange()" callback', () => {
      testClass.on('state', (state, reason) => {
        seenStates.push(state)
        seenReasonAndStates.set(state, reason)
      })
    })
    it('should allow to register "onInvalidTransition()" callback', () => {
      testClass.on('invalidTransition', (event, state) => {
        invalidTransition = { event, state }
      })
    })
    it('should be in the correct initial state', () => {
      assert.equal(testClass.getState(), 'Alfa')
    })
    it('should have all transition-table events as own functions', () => {
      assert.isFunction(testClass.toBravo)
      assert.isFunction(testClass._toBravoDone)
      assert.isFunction(testClass.toAlfa)
      assert.isFunction(testClass._toAlfaDone)
      assert.isFunction(testClass.forceToAlfa)
      assert.isFunction(testClass.forceToCharlie)
      assert.isFunction(testClass.allowedInCharlie)
      assert.isFunction(testClass.alsoAllowedInCharlie)
    })
  })

  describe('Calling the "toBravo()" event', () => {
    it('should transition the state to Bravo', async () => {
      await testClass.toBravo('fakePayload')
      assert.equal(testClass.getState(), 'Bravo')
    })
    it('should have forwarded the payload', () => {
      assert.equal(testClass.bravoParam, 'fakePayload')
      assert.equal(seenReasonAndStates.get('AlmostBravo'), 'fakePayload') // forwarded to the on(state) listener
      assert(seenReasonAndStates.has('Bravo'))
      assert.isUndefined(seenReasonAndStates.get('Bravo')) // but not forwarded to here
    })
    it('should have reported about to state changes through the callback', () => {
      assert.deepEqual(['AlmostBravo', 'Bravo'], seenStates)
      seenStates = []
    })
  })

  describe('Calling the "toBravo()" event again', () => {
    it('should trigger "onInvalidTransition()" but not the "onStateChanged()" callback', async () => {
      await testClass.toBravo('anotherFakePayload')
      assert.deepEqual({ event: 'toBravo', state: 'Bravo' }, invalidTransition)
      assert.deepEqual([], seenStates)
    })
    it('should leave the current state and the payload unchanged', () => {
      assert.equal(testClass.getState(), 'Bravo')
      assert.equal(testClass.bravoParam, 'fakePayload')
    })
  })

  describe('A non-awaited valid "toAlpha()" event', () => {
    it('should trigger the "onStateChange()" callback at first', async () => {
      testClass.toAlfa().catch(err => { throw err })
      assert.deepEqual(['AlmostAlfa'], seenStates)
      assert.equal(testClass.getState(), 'AlmostAlfa')
      seenStates = []
    })
    it('should allow the "toBravo()" event again, once Alpha is reached', async () => {
      await testClass.waitUntilStateEnters('Alfa')
      assert.equal(testClass.getState(), 'Alfa')
      assert.deepEqual(['Alfa'], seenStates)
      await testClass.toBravo('secondFakePayload')
      assert.equal(testClass.getState(), 'Bravo')
      assert.equal(testClass.bravoParam, 'secondFakePayload')
    })
  })

  // TODO improve this
  describe('waitUntilStateEnters', () => {
    it('should throw exception if timeout is reached', async () => {
      testClass.toAlfa().catch(err => { throw err })
      try {
        await testClass.waitUntilStateEnters('Alfa', 490)
        assert.isTrue(false)
      } catch (err) {
        assert.equal(err.message, 'operation timed out')
      }
    })
  })

  describe('A "*" should allow event triggers from any state', () => {
    it('the forceTo events should bring us to the target state no matter what', async () => {
      await testClass.forceToCharlie()
      assert.equal(testClass.getState(), 'Charlie')
      await testClass.forceToAlfa()
      assert.equal(testClass.getState(), 'Alfa')
      await testClass.forceToCharlie()
      assert.equal(testClass.getState(), 'Charlie')
    })
  })

  describe('Multiple events for same from-state', () => {
    it('should allow to transit to same target-state but using different events', async () => {
      await testClass.allowedInCharlie()
      assert.equal(testClass.getState(), 'Charlie')
      await testClass.alsoAllowedInCharlie()
      assert.equal(testClass.getState(), 'Charlie')
    })
  })
})
