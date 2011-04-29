/******************************************************************************
 *                                  ~cassie~                                  *
 *                                ‾‾‾‾‾‾‾‾‾‾‾‾                                *
 * Simple future library for JS. Ready to be violently raped by Ajax!         *
 *     _________________________________________________________________      *
 *        Copyright (c) 2011 Quildreen Motta // Licenced under MIT/X11        *
 ******************************************************************************/

//// Module Cassie /////////////////////////////////////////////////////////////
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
// Take an Ajax request, for example. The usual way::
//
//     var req = ajax.get('data.json'
//               , function (resp) { /* success */
//                   req.update('#data', JSON.parse(resp.responseText))
//               }
//               , function (resp) { /* fail */
//                   req.show_error()
//               })
//     setTimeout(req.fail, 10000)
//
// With promises, you could get this::
//
//     var req = ajax.get('data.json')
//                   .ok().update('#data')
//                   .failed().show_error()
//                   .timeout(10)
//
// You can pass this ``req`` object around, and other functions can add
// their own manipulations to the object as well::
//
//     function log_it(req) {
//         return req.ok(log('success'))
//                   .failed(log('failed'))
//                   .clear_timer() /* disables the timeout */
//     }
//     var req = log_it(ajax.get('data.json').timeout(10))
//

'@cassie',
function (root) {
    if (typeof exports == 'undefined') {
        old    = root.cassie
        cassie = root.cassie = {}
        cassie.clean = function() {
            root.cassie = old
            return cassie
        }}
    else
        cassie = exports


    var cassie, old
      , slice = Array.prototype.slice

      // Constants with values for errors
      , forgotten = {}
      , timeouted = {}



    ///// Object Promise ///////////////////////////////////////////////////////
    //
    // Creates a deferred object, that can be manipulated before the
    // value is actually resolved. As soon as it is fulfilled, this
    // promise will apply the pending actions.
    //
    // You can either return the promise directly, or take full
    // advantage of it by inheriting the ``Promise``'s prototoype and
    // adding your own custom methods.
    //
    function Promise () {
        this.callbacks   = {}
        this.flush_queue = []
        this.value       = null
        this.timer       = null
        this.defaultev   = 'done'
    }
    Promise.prototype = function() {
        return { add:         add
               , flush:       flush
               , done:        done
               , bind:        bind
               , fail:        fail
               , timeout:     timeout
               , clear_timer: clear_timer
               , forget:      forget

               // Shortcuts for add(event[, callback])
               , ok:          ok
               , failed:      failed
               , timeouted:   _timeouted
               , forgotten:   _forgotten }



        ////// Function add_callback ///////////////////////////////////////////
        // ::
        //     add_callback(Obj promise, Str event, Fn callback) → Fn
        //
        // Adds a callback to a ``Promise``.
        //
        // The callback will be called whenever the given event happens
        // within the given promise, in the context of the promise (ie.:
        // ``this`` inside the callback will refer to the given promise)
        // and the arguments provided when the promise was fulfilled.
        //
        // Returns the given callback function.
        //
        function add_callback(promise, event, callback) {
            get_queue(promise, event).push(callback)
            return callback
        }

        function get_queue(promise, event) {
            return promise.callbacks[event]
                || (promise.callbacks[event] = [])
        }


        ////// Method add //////////////////////////////////////////////////////
        // ::
        //     add(Str event[, Fn callback]) → Promise
        //
        // Adds a callback to the ``Promise``.
        //
        // Passing a callback directly to the add method is optional, to
        // leverage more specialized promises, Cassie supports defining
        // a default event to which callbacks are bound.
        // 
        // For example, instead of writting the following::
        // 
        //     promise.add('ok', foo).add('ok', bar)
        // 
        // You could go with::
        // 
        //     promise.add('ok').foo().bar()
        // 
        // Of course, given you have a specialized promise implementing
        // `foo` and `bar`.
        // 
        // The default event persists until another `add` call with an
        // explicit event is issued.
        // 
        // See :fn:`add_callback` for more information.
        //
        function add(event, callback) {
            if (typeof event == 'function') {
                callback = event
                event    = this.defaultev }

            _add(this, event, callback)
            return this
        }

        function _add(promise, event, callback) {
            promise.defaultev = event
            if (promise.value)
                fire(promise, event, callback)
            else
                callback && add_callback(promise, event, callback)
        }

        function fire(promise, event, callback) {
            var queue = get_queue(promise, event)
            if (callback && queue.flushed)
                return callback.apply(promise, promise.value)
        }


        ////// Method flush ////////////////////////////////////////////////////
        // ::
        //     flush(Str event) → Promise
        //
        // Calls all callbacks associated with the given event.
        //
        // The callbacks are called in the context of this ``Promise``
        // (ie.: ``this`` inside such callback will refer to this
        // ``Promise``), and with any arguments that have been passed to
        // the promise when it was fulfilled.
        //
        function flush(event) {
            if (!this.value)
                event && this.flush_queue.push(event)
            else while (event = this.flush_queue.shift())
                flush_ev(this, event) 

            return this
        }

        function flush_ev(promise, event) {
            var callbacks = promise.callbacks[event] || []
              , current

            while (current = callbacks.shift())
                current.apply(promise, promise.value)

            callbacks.flushed = true
        }
            


        ////// Method done /////////////////////////////////////////////////////
        // ::
        //     done(ArrayLike values) → Promise
        //
        // Resolves the promise to the given values and call the
        // callbacks defined for ``done``.
        //
        // The given value array is cloned, then assigned to the
        // promise. This makes it easier for caller functions to just
        // pass the ``arguments`` object straight up to this function.
        //
        // If the promise has already been resolved, this method is a
        // noop.
        //
        function done(values) {
            if (!this.value) {
                this.clear_timer().flush('done')
                this.value = slice.call(values)
                this.flush() }
            return this
        }


        ////// Method fail /////////////////////////////////////////////////////
        // ::
        //     fail(Obj error) → Promise
        //
        // Fails to fulfill the promise, and calls all the ``fail``
        // callbacks passing the error as parameter.
        //
        // See :fn:`done` for more information.
        //
        function fail() {
            return this.flush('fail').done(arguments)
        }


        ////// Method bind /////////////////////////////////////////////////////
        // ::
        //     bind(values...) → Promise
        //
        // Successfully fulfills the promise, and calls the ``bind``
        // callbacks passing the values as parameter.
        //
        // See :fn:`resolve` for more information.
        //
        function bind() {
            return this.flush('ok').done(arguments)
        }


        ////// Method timeout //////////////////////////////////////////////////
        // ::
        //     timeout(Num delay) → Promise
        //
        // Fails to fulfill the promise after the given number of
        // seconds.
        //
        // The promise fails with the value of ``timeouted``.
        //
        function timeout(delay) {
            var promise = this
            this.timer = setTimeout(function(){
                promise.flush('timeouted')
                       .fail(timeouted)
            }, delay * 1000)
            return this
        }


        ////// Method clear_timer //////////////////////////////////////////////
        // ::
        //     clear_timer() → Promise
        //
        // Clears any timer that may exist for this promise.
        //
        function clear_timer() {
            clearTimeout(this.timer)
            return this
        }


        ////// Method forget ///////////////////////////////////////////////////
        // ::
        //     forget() → Promise
        //
        // Cancels the promise, and fails with the value of ``forgotten``.
        //
        function forget() {
            return this.flush('forgotten').fail(forgotten)
        }


        ////// -Shortcuts for add(event[, callback]) //////////////////////////
        function ok(fn)         { return this.add('ok',        fn) }
        function failed(fn)     { return this.add('fail',      fn) }
        function _timeouted(fn) { return this.add('timeouted', fn) }
        function _forgotten(fn) { return this.add('forgotten', fn) }
    }()


    ///// Exṕorts //////////////////////////////////////////////////////////////
    cassie.Promise      = Promise
    cassie.forgotten    = forgotten
    cassie.timeouted    = timeouted
}(this)