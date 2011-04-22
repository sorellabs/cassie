Unleashing the Power
====================

While you can use the raw ``Promise`` object, the real power of Cassie
comes in when you extend it. This page will walk you through augmenting
the Promise object in different ways to fit your APIs.


Why, when and how to extend?
----------------------------

Extending the ``Promise`` object enables you to create sugary interfaces
for your libraries. This paragraph from `SICP`_ summarises it up quite
nicely:

    Why do we want compound data in a programming language? For the same
    reasons that we want compound procedures: to elevate the conceptual
    level at which we can design our programs, to increase the
    modularity of our designs, and to enhance the expressive power of
    our language.


In short, you would extend the basic ``Promise`` to make your code more
robust, powerful and readable. A good example of that would be creating
a better interface for Ajax requests, so you could load the resulting
code right up in some element::

    ajax.get('app/menu').update('#main-menu')


But how one go about extending Cassie? Well, Cassie provides a
prototypal ``Promise`` object that may be inherited by other objects the
usual way::

    function Vow() {
        // applies Cassie's Promise constructor to this object
        cassie.Promise.call(this)
    }
    Vow.prototype     = Object.create(cassie.Promise.prototype)
    Vow.prototype.lol = function() {
        this.add(function(){ alert('lol') })
        return this
    }

    new Vow().lol().bind() // alerts 'lol'


.. note::
   ``Object.create`` is a ECMAScript 5 function and it's only available
   on newer browsers/engines. The `ES5 Shim`_ provides a fallback
   implementation for it.


Alternatively you can create a new ``Promise`` and patch it
with new methods::

    function vow() {
        var p = new cassie.Promise
        p.lol = function() {
            this.add(function(){ alert('lol') })
            return this
        }
        return p
    }
    vow().lol().bind() // alerts 'lol'
        
If you're not sure which one to choose, you probably need to read about
inheritance in JavaScript. But the basic gist of it is that Prototypal
inheritance (the former) is faster at creation time and uses less
memory. The former allows you to leverage the power of closures and
hold private state in variables.

Brendan Eich has a nice `take on Closure vs Prototypal`_ pattern, and a
few useful links on inheritance in JavaScript.


.. _SICP: http://mitpress.mit.edu/sicp/full-text/book/book-Z-H-13.html#%_chap_2
.. _ES5 Shim: https://github.com/kriskowal/es5-shim
.. _take on Closure vs Prototypal: http://www.aminutewithbrendan.com/pages/20110216


Understanding Cassie
--------------------

Before you go about extending Cassie as you like, it's a good idea to
understand how everything fits together. But don't worry, the library is
simple enough that you can learn everything about it in no-time.

Starting with the basics, the ``Promise`` object holds three kinds of
states: a map of callback queues, the value to which the ``Promise`` has
been resolved and the default callback queue. And most functions
provided revolve around manipulating these states.


How Cassie listen to events
'''''''''''''''''''''''''''

Each ``Promise`` object holds a map of callback queues — a list of
functions that should be called when something happens with the
``Promise``. Each of these list are related to a single event, like
``ok``, ``failed`` and such.

You tell Cassie what you want to do with a ``Promise`` by adding
functions to this list. Cassie provides you with the *low-level*
function ``add`` for this, as the previous example illustrated::

    var promise = new Promise
    promise.add(function() {
        do_stuff() })

But didn't I say that a Promise has several callback queues? How Cassie
knows which one to use?

Simple, when you call ``add`` you can either tell it, explicitly, to use
one callback queue, or just add it to the default one::

    var promise = new Promise
    promise.defaultev // default queue: 'done' 

    // Adds a function to the default queue
    promise.add(function() {
        do_stuff() })

    // Adds a function to the 'failed' queue
    promise.add('failed', function() {
        oh_shit() })


The important thing to remember here is that, whenever you tell Cassie
to use a specific queue on ``add``, Cassie will start using that as the
default queue. This is so you can chain these methods without the need
to give the queue that Cassie should use at every call::

    promise.add('failed').add(function(){ do_stuff()   })
                         .add(function(){ more_stuff() })


In this case, both functions are being added to the ``failed`` queue.

.. note::
   Cassie provides shortcuts for the default queues. ``ok``, ``failed``,
   ``timeouted`` and ``forgotten`` are available as sugar for ``add``.


Resolving promises
''''''''''''''''''

Resolving a promise means assigning a value to it, this value being a
list of arguments that will be passed to all functions waiting for it
(where applicable)::

    var promise = new cassie.Promise
    promise.add(function(x, y, z) { alert(x * y * z) })
           .bind(1, 2, 3) // alerts 6


A promise may be resolved at most once, otherwise it'll throw an
error. This is so we don't have promises succeding and then magically
failing as well.

When a promise is resolved, it can only succeed or fail. If a promise
succeeds, all callbacks waiting for the ``ok`` status are called,
receiving the value of the ``Promise`` on its argument's list. If a
promise fails, the callbacks waiting for ``failed`` are
called. Regardless of the status to which a Promise is resolved, the
``done`` queue is always flushed — the is, all its callbacks are
called.

It's important to note that after Cassie flushes each one of these
queues, they are cleared. And if any function is added to the queue
after the Promise has been resolved, it is immediately called if such
queue has been flushed.


Specialized states
''''''''''''''''''

Internally a ``Promise`` either fails or succeeds, but sometimes you'll
want to have a better explanation of what exactly failed or
succeeded. For these instances Cassie makes it easy to implement
specialised statuses.

First, understand that by *specialised statuses* I mean that these
will fire their own queue of callbacks whenever a function resolves to
them, albeit ultimately they represent either fail or success.

The tree below show the hierarchy between these states. The queues are
flushed from the most specialised state to the least one:

.. code-block:: text

                      done
                      /  \
                     /    \
                    /      \
                   ok    failed
                         /    \
                        /      \
                       /        \
                 timeouted    forgotten


You can create such states by simply asking them to be flushed before
resolving the Promise. For example, this is all the code used to create
the specialised state ``forgotten``::

    var forgotten = {}
    function forget() {
        return this.flush('forgotten').fail(forgotten)
    }

Queues that are flushed before the ``Promise`` is resolved are added to
a *"flush queue"*, which will be processed in order when the ``Promise``
gets resolved.
