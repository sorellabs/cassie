/******************************************************************************
 *                                   ~ajax~                                   *
 *                                 ‾‾‾‾‾‾‾‾‾‾                                 *
 * Simple Ajax example using Cassie's Promises.                               *
 *     _________________________________________________________________      *
 *        Copyright (c) 2011 Quildreen Motta // Licenced under MIT/X11        *
 ******************************************************************************/

'@global',
function (root, cassie) {

    // Aliases for some JavaLongPropertyNames.Within.Java.Long.Objects
    var has = Object.prototype.hasOwnProperty
      , cls = Object.prototype.toString

      , state_map = ["setup", "loading", "loaded", "interactive"]

    //// HELPER FUNCTIONS //////////////////////////////////////////////////////
    // Makes a constructor inherit `base' and implement `props'.
    function extend(ctor, base, props) {
        var prop
        ctor.prototype             = Object.create(base)
        ctor.prototype.constructor = ctor

        for (prop in props)
            if (has.call(props, prop))
                ctor.prototype[prop] = props[prop]
    }

    // Return the element with the given `id' (not sanitised for IE)
    function el(elm) {
        return classOf(elm) == 'String'? document.getElementById(elm)
                                       : elm
    }

    // Return the internall [[Class]] of the given `obj'
    function classOf(obj) {
        return cls.call(obj).slice(8, -1)
    }

    // Creates a new element
    function create(tag) {
        return document.createElement(tag)
    }

    // Returns a short date representation
    function date(d) {
        return (d || new Date).toDateString()
    }

    // Simple templating function, like Python's str.format
    function fmt(str, data) {
        return str.replace(/{(.+?)}/g, function(m, id) {
            return data[id] })
    }
        


    //// SPECIALISED PROMISE FOR AJAX //////////////////////////////////////////
    extend(AjaxVow, cassie.Promise.prototype, AjaxVow__proto__())
    function AjaxVow() {
        cassie.Promise.call(this)
    }
    function AjaxVow__proto__() {
        // The methods that will be exposed to the AjaxVow object:
        return { update:      update
               , log:         log
               , delay:       delay
               , error:       error
               , setup:       setup
               , loading:     loading
               , loaded:      loaded
               , interactive: interactive }

        // Utilities to manipulate content -------------------------------------
        // Replaces the content of an element with the returned data
        function update(elm) {
            function up(req, data) { el(elm).innerHTML = data }
            return this.add(up)
        }

        // Inserts the returned data at the top of the element
        function ins(promise, req, data, elm, cls) {
            var c = create('li')
            elm         = el(elm)
            c.className = cls || ""
            c.innerHTML = fmt('[{date}] {method} "{uri}" {status}: {data}'
                             ,{ date:   date()
                              , method: promise.method
                              , uri:    promise.uri
                              , status: req.status
                              , data:   data })
            elm.insertBefore(c, elm.firstChild)
        }

        // Logs a general information on the log stack
        function log(elm) {
            return this.add(function(req, data){
                ins(this, req, data, elm) })
        }

        // Logs an error message on the log stack
        function error(elm) {
            return this.add(function(req, data){
                ins(this, req, data, elm, 'error') })
        }

        // Calls a callback after some delay
        function delay(time, fn) {
            function call() { setTimeout(fn, time * 1000) }
            return this.add(call)
        }
        
        // Callbacks for Ajax's states                               readyState
        function setup(f)      { return this.add('setup',       f) } // 0
        function loading(f)    { return this.add('loading',     f) } // 1
        function loaded(f)     { return this.add('loaded',      f) } // 2
        function interactive(f){ return this.add('interactive', f) } // 3
    }

    //// AJAX REQUEST WRAPPER /////////////////////////////////////////////////
    function ajax(method, uri, data) {
        var req     = new XMLHttpRequest
          , promise = new AjaxVow
          , success = /0|2\d{2}/


        // Remember which method and uri we used, so we can use them on
        // the log
        promise.method = method
        promise.uri    = uri

        // Open an URL asynchronously and listen to each change on its
        // state
        req.open(method, uri, true)
        req.onreadystatechange = function() {
            var res    = req.responseText
              , state  = req.readyState
              , status = req.status

            // Flushes the curent readyState's queue of callbacks
            promise.flush(state_map[state])

            // If the request has been completed, either resolve the
            // promise successfully (status == 2xx), or resolve the
            // promise with an error.
            if (state == 4)
                success.test(status)? promise.bind(req, res)
                                    : promise.fail(req, res) }

        // Send the request to the server
        req.send(data)
        return promise
    }
    // Just a wrapper for the general ajax request that assumes a GET
    function get(uri) {
        return ajax('GET', uri, null)
    }
    

    //// APPLICATION CODE //////////////////////////////////////////////////////
    // Requests the url `hello.txt'. After the request has been
    // successfully completed, the data should be logged in the
    // log-stack, and the function should be called again in 2 seconds.
    //
    // If the request was successfull, we also update the #world div
    // with the returned data.
    function hello() {
        get('hello.txt').log('log-stack').delay(2, hello)
                        .ok().update('world')
    }
    hello()

    // Requests the url `nu-uh', and if shit happens, logs the error
    // message in the log-stack
    get('nu-uh').failed().error('log-stack')

    // Requests `hello.txt' and updates the log-stack with the data, if
    // the request was successful.
    //
    // Though it'll never be as we forget about the promise before
    // sending the request...
    get('hello.txt').ok().update('log-stack')
                    .forget()

}(this, cassie)
