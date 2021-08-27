# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [2.2.0] - 27 Aug 2021

### Changed

- Updated dependencies
- Updated badges
- Improved github integration
- Forwarding additional event arguments also to state listeners ([cstim](https://github.com/heisenware/fsm-async/commits?author=cstim))

## [2.1.0] - 08 Oct 2019

- Made `StateMachine` class an EventEmitter by extending it

## [2.0.0]

### Changed

- Re-implemented StateMachine.js to use `class` feature
- Adapted all corresponding example code and documentation
- Changed public API by renaming `waitUntilState` to `waitUntilStateEnters`
- Improved tests by separating out fixture and by make the cases more general
- Updated dependencies

### Added

- Public API function called `waitUntilStateLeaves`
- This file

## [1.1.2] - 26 Feb 2018

### Fixed

- Fixed bug in waitUntilState

## [1.1.1] - 20 Feb 2018

### Fixed

- Fixed bug that prevented having multiple events for the same from-state

## [1.1.0] - 15 Feb 2018

### Added

- Added feature of specifiying a "*" in the transtion table allowing an event on
  any state

## [1.0.0] - 13 Feb 2018

First official release
