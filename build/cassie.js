require.define("/node_modules/cassie/package.json", function (require, module, exports, __dirname, __filename) {
module.exports = {"main":"./src/cassie.js"}
});

require.define("/node_modules/cassie/src/cassie.js", function (require, module, exports, __dirname, __filename) {
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



//// -- Special constants ---------------------------------------------------

//// Data FORGOTTEN
// Used as a value for forgotten/cancelled promises.
//
// FORGOTTEN :: Object
var FORGOTTEN = {}

//// Data TIMEOUTED
// Used as a value for promises that failed with a timeout.
//
// TIMEOUTED :: Object
var TIMEOUTED = {}



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
  // fail :: @this:Promise*, Any -> this
, fail:
  function _fail(error) {
    return this.flush('failed').done([error]) }


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
    return this.flush('forgotten').fail(FORGOTTEN) }


  ///// Function timeout
  // Schedules the promise to fail after a given number of seconds.
  //
  // timeout :: @this:Promise*, Number -> this
, timeout:
  function _timeout(delay) {
    this.clear_timer()
    this.timer = setTimeout( function(){ this.flush('timeouted')
                                             .fail(TIMEOUTED)    }.bind(this)
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
, ok:
  function _ok(fun) {
    return this.on('ok', fun) }


  ///// Function failed
  // Registers a callback for when the promise fails to be fulfilled.
  //
  // failed :: @this:Promise*, Fun -> this
, failed:
  function _failed(fun) {
    return this.on('failed', fun) }


  ///// Function timeouted
  // Registers a callback for when the promise fails by timing out.
  //
  // timeouted :: @this:Promise*, Fun -> this
, timeouted:
  function _timeouted(fun) {
    return this.on('timeouted', fun) }


  ///// Function forgotten
  // Registers a callback for when the promise fails by being
  // cancelled.
  //
  // forgotten :: @this:Promise*, Fun -> this
, forgotten:
  function _forgotten(fun) {
    return this.on('forgotten', fun) }
})



//// -- Exports ---------------------------------------------------------------
module.exports = { Promise   : Promise
                 , FORGOTTEN : FORGOTTEN
                 , TIMEOUTED : TIMEOUTED

                 , internals : { get_queue: get_queue }}

});

require.define("/node_modules/cassie/node_modules/boo/package.json", function (require, module, exports, __dirname, __filename) {
module.exports = {"main":"./src/boo.js"}
});

require.define("/node_modules/cassie/node_modules/boo/src/boo.js", function (require, module, exports, __dirname, __filename) {
/// boo.js --- Prototypical utilities
//
// Copyright (c) 2011 Quildreen Motta
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

/// Module boo
void function(root, exports) {
  var slice   = [].slice
    , keys    = Object.keys
    , inherit = Object.create


  
  //// - Interfaces -----------------------------------------------------------

  ///// Interface DataObject
  // :: { "to_data" -> () -> Object }


  
  //// - Helpers --------------------------------------------------------------

  ///// Function data_obj_p
  // :internal:
  // Checks if the given subject matches the DataObject interface
  //
  // data_obj_p :: Any -> Bool
  function data_obj_p(subject) {
    return subject != null
    &&     typeof subject.to_data == 'function' }


  ///// Function resolve_mixins
  // :internal:
  // Returns the proper mixin for the given object.
  //
  // resolve_mixin :: Object -> Object
  function resolve_mixin(object) {
    return data_obj_p(object)?  object.to_data()
    :                           object }


  ///// Function fast_extend
  // :internal:
  // Extends the target object with the provided mixins, using a
  // right-most precedence rule — when a there's a property conflict, the
  // property defined in the last object wins.
  //
  // `DataObject's are properly handled by the `resolve_mixin'
  // function.
  //
  // :warning: low-level
  //    This function is not meant to be called directly from end-user
  //    code, use the `extend' function instead.
  //
  // fast_extend :: Object, [Object | DataObject] -> Object
  function fast_extend(object, mixins) {
    var i, j, len, mixin, props, key
    for (i = 0, len = mixins.length; i < len; ++i) {
      mixin = resolve_mixin(mixins[i])
      props = keys(mixin)
      for (j = props.length; j--;) {
        key         = props[j]
        object[key] = mixin[key] }}

    return object }


  
  //// - Basic primitives -----------------------------------------------------

  ///// Function extend
  // Extends the target object with the provided mixins, using a
  // right-most precedence rule.
  //
  // :see-also:
  //   - `fast_extend' — lower level function.
  //   - `merge'       — pure version.
  //
  // extend :: Object, (Object | DataObject)... -> Object
  function extend(target) {
    return fast_extend(target, slice.call(arguments, 1)) }


  ///// Function merge
  // Creates a new object that merges the provided mixins, using a
  // right-most precedence rule.
  //
  // :see-also:
  //   - `extend' — impure version.
  //
  // merge :: (Object | DataObject)... -> Object
  function merge() {
    return fast_extend({}, arguments) }

  ///// Function derive
  // Creates a new object inheriting from the given prototype and extends
  // the new instance with the provided mixins.
  //
  // derive :: Object, (Object | DataObject)... -> Object
  function derive(proto) {
    return fast_extend(inherit(proto), slice.call(arguments, 1)) }


  
  //// - Root object ----------------------------------------------------------

  ///// Object Base
  // The root object for basing all the OOP code. Provides the previous
  // primitive combinators in an easy and OOP-way.
  var Base = {

    ////// Function make
    // Constructs new instances of the object the function is being
    // applied to.
    //
    // If the object provides an ``init`` function, that function is
    // invoked to do initialisation on the new instance.
    //
    // make :: Any... -> Object
    make:
    function _make() {
      var result = inherit(this)
      if (typeof result.init == 'function')
        result.init.apply(result, arguments)

      return result }

    ////// Function derive
    // Constructs a new object that inherits from the object this function
    // is being applied to, and extends it with the provided mixins.
    //
    // derive :: (Object | DataObject)... -> Object
  , derive:
    function _derive() {
      return fast_extend(inherit(this), arguments) }}


  
  //// - Exports --------------------------------------------------------------
  exports.extend   = extend
  exports.merge    = merge
  exports.derive   = derive
  exports.Base     = Base
  exports.internal = { data_obj_p    : data_obj_p
                     , fast_extend   : fast_extend
                     , resolve_mixin : resolve_mixin
                     }

}
( this
, typeof exports == 'undefined'? this.boo = this.boo || {}
  /* otherwise, yay modules! */: exports
)
});
