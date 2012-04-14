/// cassie.js --- Simple future library for JS. Ready to be raped by Ajax!
//
// // Copyright (c) 2011 Quildreen Motta
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation files
// (the "Software"), to deal in the Software without restriction,
// including without limitation the rights to use, copy, modify, merge,
// publish, distribute, sublicense, and/or sell copies of the Software,
// and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/// Module cassie


//// -- Dependencies --------------------------------------------------------
var Base = require('boo').Base



//// -- Aliases -------------------------------------------------------------
var slice = [].slice



//// -- Helpers -------------------------------------------------------------

///// Function get_queue
// Returns a list of callbacks registered for the event.
//
// If callbacks ain't defined for the event yet, it's also *initialised*
// to an empty array.
//
// get_queue! :: Promise*, String -> [Fun]
function get_queue(promise, event) {
  return promise.callbacks[event]
  ||    (promise.callbacks[event] = []) }


///// Function register
// Creates a function that registers handlers for the given event.
//
// register! :: String -> @this:Promise*, Fun -> this
function register(event) { return function(fun) {
  return this.on(event, fun) }}



//// -- Public interface ----------------------------------------------------

///// Object Promise <| Base
// A placeholder for a value that can be computed asynchronously.
//
// The `Promise' allows any code to define how they'll handle the value
// before the value is actually computed, by adding listeners to the
// various events that can be triggered once a promise is fulfilled.
//
// Promise :: { "callbacks"     -> { String -> [Fun] }
//            , "flush_queue"   -> [Fun]
//            , "value"         -> [Any]
//            , "timer"         -> TimerID
//            , "default_event" -> String
//            }
var Promise = Base.derive({
  ///// Function init
  // Initialises an instance of a Promise.
  //
  // init! :: @this:Object* -> this
  init:
  function _init() {
    this.callbacks     = {}
    this.flush_queue   = []
    this.value         = null
    this.timer         = null
    this.default_event = 'done'
    return this }


  ///// Function on
  // Adds a callback to the given event.
  //
  // on! :: @this:Promise*, String, Fun -> this
, on:
  function _on(event, callback) {
    this.default_event = event

    if (this.value)  invoke_callback(this)
    else             add_callback(this)

    return this

    // Invokes all the callbacks for the event
    function invoke_callback(promise) {
      var queue = get_queue(promise, event)
      return callback && queue.flushed?  callback.apply(promise, promise.value)
      :      /* otherwise */             null }

    // Adds the callback to the event
    function add_callback(promise) {
      return callback?  get_queue(promise, event).push(callback)
      :                 null }}


  ///// Function then
  // Adds a callback to the active event queue.
  //
  // The active event queue is the one for which the last callback was
  // registered, usually. It is controlled by the internal
  // `default_event' property.
  //
  // then! :: @this:Promise*, Fun -> this
, then:
  function _then(callback) {
    return this.on(this.default_event, callback) }



  ///// Function flush
  // Fires all the callbacks for the event.
  //
  // If the promise hasn't been resolved yet, the callbacks are placed
  // in a queue to be flushed once the Promise is fulfilled.
  //
  // flush :: @this:Promise*, String -> this
, flush:
  function _flush(event) {
    var self = this

      !this.value?     queue_event(event)
    : event?           flush_queue(event)
    : /* otherwise */  flush_all()

    return this


    // Adds the event to the flush queue
    function queue_event(event) {
      if (event) self.flush_queue.push(event) }

    // Calls all of the callbacks related to a given event
    function flush_queue(event) {
      var callbacks = get_queue(self, event)

      callbacks.forEach(function(callback) {
                          callback.apply(self, self.value) })
      callbacks.length  = 0
      callbacks.flushed = true }

    // Calls the callbacks for all events that have been queued
    function flush_all() {
      self.flush_queue.forEach(flush_queue) }}


  ///// Function done
  // Fulfills the promise with the values given.
  //
  // done :: @this:Promise*, [Any] -> this
, done:
  function _done(values) {
    if (!this.value) {
      this.clear_timer()
      this.flush('done')
      this.value = slice.call(values)
      this.flush() }

    return this }


  ///// Function fail
  // Fails to fulfill the promise.
  //
  // fail :: @this:Promise*, Any... -> this
, fail:
  function _fail() {
    return this.flush('failed').done(arguments) }


  ///// Function bind
  // Successfully fulfills the promise.
  //
  // bind :: @this:Promise*, Any... -> this
, bind:
  function _bind() {
    return this.flush('ok').done(arguments) }


  ///// Function forget
  // Cancels the promise.
  //
  // forget :: @this:Promise* -> this
, forget:
  function _forget() {
    return this.flush('forgotten').fail('forgotten') }


  ///// Function timeout
  // Schedules the promise to fail after a given number of seconds.
  //
  // timeout :: @this:Promise*, Number -> this
, timeout:
  function _timeout(delay) {
    this.clear_timer()
    this.timer = setTimeout( function(){ this.flush('timeouted')
                                             .fail('timeouted')  }.bind(this)
                           , delay * 1000)

    return this }


  ///// Function clear_timer
  // Stop the timer for the promise, if one was previously set by
  // invoking `timeout'.
  //
  // clear_timer :: @this:Promise* -> this
, clear_timer:
  function _clear_timer() {
    clearTimeout(this.timer)
    this.timer = null
    return this }


  ///// Function ok
  // Registers a callback for when the promise is successfully
  // fulfilled.
  //
  // ok :: @this:Promise*, Fun -> this
, ok: register('ok')

  ///// Function failed
  // Registers a callback for when the promise fails to be fulfilled.
  //
  // failed :: @this:Promise*, Fun -> this
, failed: register('failed')

  ///// Function timeouted
  // Registers a callback for when the promise fails by timing out.
  //
  // timeouted :: @this:Promise*, Fun -> this
, timeouted: register('timeouted')

  ///// Function forgotten
  // Registers a callback for when the promise fails by being
  // cancelled.
  //
  // forgotten :: @this:Promise*, Fun -> this
, forgotten: register('forgotten')
})



//// -- Exports ---------------------------------------------------------------
module.exports = { Promise   : Promise
                 , register  : register

                 , internals : { get_queue: get_queue }}
