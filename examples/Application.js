'use strict'

const Manager = require('./Manager')

class Application {

  async run () {
    // Create manager instance
    const manager = new Manager()

    manager.onStateChange((state) => {
      console.log(`Application: Manager state updated to ${state}`)
    })

    manager.onInvalidTransition((event, state) => {
      console.log(`Application: Event ${event} is not valid in state ${state}`)
    })

    try {
      // Connect
      await manager.enable()
      // Disconnect
      await manager.disable()
    } catch (err) {
      console.log(err)
    }
  }
}

module.exports = Application
