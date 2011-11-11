/// cassie.js --- Simple future library for JS. Ready to be raped by Ajax!
//
// Copyright (c) 2011 Quildreen Motta
//
// Version: 0.3.0
// Author:  Quildreen Motta <quildreen@gmail.com>
// URL:     http://github.com/killdream/cassie
//
// Licensed under the permissive MIT/X11 Licence.

/// -Installation
//
// Cassie's Promise objects depend on the
// [[http://github.com/killdream/boo][boo]] library. You need to have
// that properly set-up before you can use Cassie properly.
//
// If you're downloading it from NPM, things will be already properly
// handled for you:
//
// :  $ npm install cassie
//
// If you're downloading it directly, you'll also need to get =boo=, as
// cassie's objects depend on that object orientation library.
//
// :  $ cp cassie.js ~/path/to/project/node_modules
//
// In any case, running in a node environment, you just need to require
// the library:
//
// :  var cassie = require('cassie')
//
// If you're running it in a Browser, you will need to require =boo= and
// =cassie= in order:
//
// :  <script src="/path/to/boo.js"></script>
// :  <script src="/path/to/cassie.js"></script>
//

/// Module cassie
//
// Cassie (short for lil' Cassandra) is a deliciously short future
// library for JavaScript. It provides a simple Promise object that can
// be used as the return value of any asynchronous call.
//
// The idea behind promises is that you can manipulate the return value
// of an asynchronous function before the function has been
// resolved. This allows you to write in a clear chaining DSL rather
// than using a clusterfuck of callbacks.
//
// Take an Ajax request, for example. The usual way:
//
// #+BEGIN_SRC js
//     var req = ajax.get('data.json'
//               , function (resp) { /* success */
//                   req.update('#data', JSON.parse(resp.responseText))
//               }
//               , function (resp) { /* fail */
//                   req.show_error()
//               })
//     setTimeout(req.fail, 10000)
// #+END_SRC
//
// With promises, you could get this:
//
// #+BEGIN_SRC js
//     var req = ajax.get('data.json')
//                   .ok().update('#data')
//                   .failed().show_error()
//                   .timeout(10)
// #+END_SRC
//
// You can pass this `req` object around, and other functions can add
// their own manipulations to the object as well:
//
// #+BEGIN_SRC js
//     function log_it(req) {
//         return req.ok(log('success'))
//                   .failed(log('failed'))
//                   .clear_timer() /* disables the timeout */
//     }
//     var req = log_it(ajax.get('data.json').timeout(10))
// #+END_SRC

void function (root, requirep, exportsp) {

  var cassie, old

  , boo = requirep?  require('boo') : root.boo


  // Aliases for some long properties
  , slice = Array.prototype.slice

  // Constants with values for errors
  , forgotten = {}
  , timeouted = {}


  //// Function callablep
  // Checks if something can be called (implements the internal
  // [[Call]] property.
  //
  // callable? :: Obj → Bool
  function callablep(subject) {
    return typeof subject == 'function'
  }

  //// Function add_callback
  // Adds a callback to a =Promise=.
  //
  // :warning: side-effects
  //    The list of callbacks is modified in-place, if a truthy value
  //    is passed as the callback.
  //
  // add-callback :: Promise, Str, Fn → Num
  function add_callback(promise, event, callback) {
    return callback?  get_queue(promise, event).push(callback)
         :            null
  }

  //// Function get_queue
  // Returns the list of callbacks for the given field.
  //
  // get-queue :: Promise, Str → [Fn]
  function get_queue(promise, event) {
    return promise.callbacks[event]
        || (promise.callbacks[event] = [])
  }

  //// Function fire
  // Apply the given callback to the =Promise='s value.
  //
  // fire :: Promise, Str, Fn → Any
  function fire(promise, event, callback) { var queue
    queue = get_queue(promise, event)
    if (callback && queue.flushed)
      return callback.apply(promise, promise.value)
  }

  //// Function flush_event
  // Applies all the callbacks for a given event.
  //
  // flush-event :: Promise, Str → Undef
  function flush_event(promise, event) { var callbacks, current
    function next(){ return current = callbacks.shift() }

    callbacks = get_queue(promise, event)
    while (next())
      current.apply(promise, promise.value)

    callbacks.flushed = true
  }



  //// Object Promise
  // Creates a deferred object, that can be manipulated before the
  // value is actually resolved. As soon as it is fulfilled, this
  // promise will apply the pending actions.
  //
  // You can either return the promise directly, or take full
  // advantage of it by inheriting the `Promise`'s prototoype and
  // adding your own custom methods.
  //
  // Promise :: callbacks(Obj)
  //         ⋃ flush_queues([Fn])
  //         ⋃ value(Any)
  //         ⋃ timer(Unknow)
  //         ⋃ default_event(Str)
  var Promise = boo.Base.clone({
    ///// Function __init__
    // Initialises an instance of a =Promise=
    //
    // *init* :: Obj → Obj
    __init__:
    function init() {
      return boo.extend(this, [{ callbacks:     {}
                               , flush_queue:   []
                               , value:         null
                               , timer:         null
                               , default_event: 'done' }])
    },

    ///// Function add
    // Adds a callback to the =Promise=.
    //
    // Passing an event name directly to the add method is optional,
    // to leverage more specialised promises, Cassie supports
    // defining a default event to which callbacks are bound.
    //
    // For example, instead of writing the following:
    //
    // :  promise.add('ok', foo).add('ok', bar)
    //
    // You could go with:
    //
    // :  promise.add('ok', foo).add(bar)
    //
    // The default event persists until another =add= call with an
    // explicit event is issued.
    //
    // add :: event, callback → this
    // add :: callback → this
    add:
    function add(event, callback) {
      if (callablep(event)) {
        callback = event
        event    = this.default_event }

      this.default_event = event

      if (this.value)  fire(this, event, callback)
      else             add_callback(this, event, callback)

      return this
    },

    ///// Function flush
    // Calls all callbacks associated with the given event.
    //
    // The callbacks are called in the context of this =Promise=
    // (ie.: =this= inside the callback will refer to the
    // =Promise=), and with any arguments that have been passed to
    // the promise when it was fulfilled.
    //
    // flush :: Str → this
    flush:
    function flush(event) { var self = this
      if (!this.value)  queue()
      else
        while (next())  flush_event(this, event)

      return this

      function next() { return event = self.flush_queue.shift()      }
      function queue(){ return event && self.flush_queue.push(event) }
    },

    ///// Function done
    // Resolves the =Promise= to the given values, and call the callbacks
    // defined for =done=.
    //
    // The given value array is cloned, then assigned to the
    // promise. This makes it easier for caller functions to just pass
    // the =arguments= object straight up to this function.
    //
    // If the promise has already been resolved, this function is a
    // no-op.
    //
    // done :: [Any] → this
    done:
    function done(values) {
      if (!this.value) {
        this.clear_timer().flush('done')
        this.value = slice.call(values)
        this.flush() }
      return this
    },

    ///// Function fail
    // Fails to fulfill the =Promise=, and calls all of the =failed=
    // callbacks passing the error as parameter.
    //
    // fail :: Obj → this
    fail:
    function fail(error) {
      return this.flush('failed').done([error])
    },

    ///// Function bind
    // Successfully fulfills the =Promise=, and calls the =ok= callbacks
    // passing the values as parameter.
    //
    //
    // bind :: Any... → this
    bind:
    function bind() {
      return this.flush('ok').done(arguments)
    },

    ///// Function timeout
    // Fails to fulfill the =Promise= after the given number of seconds,
    // and fails with the value of =timeouted=.
    //
    // timeout :: Num → this
    timeout:
    function timeout(delay) {
      this.clear_timer()
      this.timer = setTimeout(function() {
        this.flush('timeouted').fail(timeouted)
      }.bind(this), delay * 1000)

      return this
    },

    ///// Function clear_timer
    // Clears any timer that may exist for this promise.
    //
    // clear-timer :: → this
    clear_timer:
    function clear_timer() {
      clearTimeout(this.timer)
      return this
    },

    ///// Function forget
    // Cancels the =Promise=, and fails with the value of =Forgotten=.
    //
    // forget :: → this
    forget:
    function forget() {
      return this.flush('forgotten').fail(forgotten)
    },

    ///// Function ok
    // Adds callbacks for the =ok= event.
    //
    // ok :: Fn → this
    ok:
    function ok(fn) { return this.add('ok', fn) },

    ///// Function failed
    // Adds callbacks for the =failed= event.
    //
    // failed :: Fn → this
    failed:
    function failed(fn) { return this.add('failed', fn) },

    ///// Function timeouted
    // Adds callbacks for the =timeouted= event.
    //
    // timeouted :: Fn → this
    timeouted:
    function _timeouted(fn) { return this.add('timeouted', fn) },

    ///// Function forgotten
    // Adds callbacks for the =forgotten= event.
    //
    // forgotten :: Fn → this
    forgotten:
    function _forgotten(fn) { return this.add('forgotten', fn) }
  })



  if (!exportsp) {
    old    = root.cassie
    cassie = root.cassie = {}

    //// Function make_local
    // Removes =cassie= from the global object.
    //
    // make-local :: → Cassie
    cassie.make_local = function() {
      root.cassie = old
      return cassie }}
  else
    cassie = exports


  //// Exports
  cassie.Promise   = Promise
  cassie.forgotten = forgotten
  cassie.timeouted = timeouted

  cassie.internals = { callablep:    callablep
                     , add_callback: add_callback
                     , get_queue:    get_queue
                     , fire:         fire
                     , flush_event:  flush_event
                     }

// -- cassie.js ends here --
}
( this                            // root
, typeof require == 'function'    // has modules
, typeof exports != 'undefined'   // has object for exposed members
)
