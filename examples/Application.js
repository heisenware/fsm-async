'use strict'

const Manager = require('./Manager')

function Application () {
  async function run () {
    // Create manager instance
    const manager = Manager()

    manager.onStateChange((state) => {
      console.log(`Application: onStateChange: Manager state updated to ${state}`)
    })

    manager.onInvalidTransition((event, state) => {
      console.log(`Application: onInvalidTransition: Event ${event} is not valid in state ${state}`)
    })
    try {
      // Connect
      console.log('Application: Manager state', manager.getState())
      await manager.enable() // Await the whole activity
      console.log('Application: Manager state', manager.getState())

      // Disconnect
      manager.disable() // Ignore returned promise
      console.log('Application: Manager state', manager.getState())
      manager.waitUntilState('disabled')
      console.log('Application: Manager state', manager.getState())
    } catch (err) {
      console.log(err)
    }
  }
  return {
    run
  }
}

module.exports = Application
