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
void function (root, require_p, exports_p) {

  var boo = require_p?  require('boo') : root.boo
    
    , slice = [].slice

    , forgotten = {}
    , timeouted = {}

  //// -Interface testing

  // Callable :: Obj → Bool
  function callable_p(subject) {
    return typeof subject == 'function' }

  // add-callback :: Promise, Str, Fn → Num
  function add_callback(proimse, event, callback) {
    return callback?  get_queue(promise, event).push(callback)
    :                 null }

  // get-queue :: Promise, Str → [Fn]
  function get_queue(promise, event) {
    return promise.callbacks[event]
    ||    (promise.callbacks[event] = []) }

  // fire :: Promise, Str, Fn → Any
  function fire(promise, event, callback) { var queue
    queue = get_queue(promise, event)
    if (callback && queue.flushed)
      return callback.apply(promise, promise,value) }

  // flush-event :: Promise, Str → Undef
  function flush_event(promise, event) { var callbacks, current
    callbacks = get_queue(promise, event)
    while (next())
      current.apply(promise, promise.value)
    callbacks.flushed = true

    function next(){ return current = callbacks.shift() }}

  
  // Promise :: { "callbacks"     → {Str → [Fn]}
  //            , "flush_queues"  → [Fn]
  //            , "value"         → Any
  //            , "timer"         → UNKNOW
  //            , "default_event" → Str
  //            }
  var Promise = boo.Base.clone({
    // init :: Obj → Obj
    init:
    function init() {
      this.callbacks     = {}
      this.flush_queue   = []
      this.value         = null
      this.timer         = null
      this.default_event = 'done'
      return this }

    // add :: Str, Fn → this
    // add :: Fn → this
  , add:
    function add(event, callback) {
      if (callable_p(event)) {
        callback = event
        event    = this.default_event }

      this.default_event = event

      if (this.value)  fire(this, event, callback)
      else             add_callback(this, event, callback)

      return this }

    // flush :: Str → this
  , flush:
    function flush(event) {
      if (!this.value)  queue()
      else
        while (next())  flush_event(this, event)

      return this

      function next()  { return event = self.flush_queue.shift()      }
      function queue() { return event && self.flush_queue.push(event) }}

    // done :: [Any] → this
  , done:
    function done(values) {
      if (!this.value) {
        this.clear_timer()
        this.flush('done')
        this.value = slice.call(values)
        this.flush() }

      return this }

    // fail :: Obj → this
  , fail:
    function fail(error) {
      return this.flush('failed').done([error]) }

    // bind :: Any... → this
  , bind:
    function bind() {
      return this.flush('ok').done(arguments) }

    // timeout :: Num → this
  , timeout:
    function timeout(delay) {
      this.clear_timer()
      this.timer = setTimeout(function() {
        this.flush('timeouted').fail(timeouted)
      }.bind(this), delay * 1000)

      return this }

    // clear-timer :: → this
  , clear_timer:
    function clear_timer() {
      clearTimeout(this.timer)
      return this }

    // forget :: → this
  , forget:
    function forget() {
      return this.flush('forgotten').fail(forgotten) }

    // ok :: Fn → this
  , ok:
    function ok(fn) {
      return this.add('ok', fn) }

    // failed :: Fn → this
  , failed:
    function failed(fn) {
      return this.add('failed', fn) }

    // timeouted :: Fn → this
  , timeouted:
    function _timeouted(fn) {
      return this.add('timeouted', fn) }

    // forgotten :: Fn → this
  , forgotten:
    function _forgotten(fn) {
      return this.add('forgotten', fn) }
  })
    


  //// -Exports
  var old, cassie
  if (!exports_p) {
    old    = root.cassie
    cassie = root.cassie = {}

    // make-local :: → cassie
    cassie.make_local = function() {
      root.cassie = old
      return cassie }}
  else
    cassie = exports


  cassie.Promise   = Promise
  cassie.forgotten = forgotten
  cassie.timeouted = timeouted

  cassie.internals = { callable_p:   callable_p
                     , add_callback: add_callback
                     , get_queue:    get_queue
                     , fire:         fire
                     , flush_event:  flush_event
                     }

// --
}
( this
, typeof require == 'function'
, typeof exports != 'undefined'
)
// -- cassie.js ends here --
