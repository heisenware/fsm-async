const StateMachine = require('../../lib/StateMachine')

class TestClass extends StateMachine {

  constructor () {
    const transitionTable = {
      initial: 'Alfa',
      transitions: [
        {ev: 'toBravo', from: 'Alfa', to: 'AlmostBravo'},
        {ev: '_toBravoDone', from: 'AlmostBravo', to: 'Bravo'},
        {ev: 'toAlfa', from: 'Bravo', to: 'AlmostAlfa'},
        {ev: '_toAlfaDone', from: 'AlmostAlfa', to: 'Alfa'},
        {ev: 'forceToAlfa', from: '*', to: 'Alfa'},
        {ev: 'forceToCharlie', from: '*', to: 'Charlie'},
        {ev: 'allowedInCharlie', from: 'Charlie', to: 'Charlie'},
        {ev: 'alsoAllowedInCharlie', from: 'Charlie', to: 'Charlie'}
      ]
    }
    super(transitionTable)
  }

  // on<state>
  async onAlmostBravo (bravoParam) {
    this._bravoParam = bravoParam
    // Simulate something longer-lasting
    await new Promise(resolve => setTimeout(resolve, 500))
    await this._toBravoDone()
  }

  async onAlmostAlfa () {
    // Simulate something longer-lasting
    await new Promise(resolve => setTimeout(resolve, 500))
    await this._toAlfaDone()
  }

  get bravoParam () {
    return this._bravoParam
  }
}

module.exports = TestClass
