API Documentation
=================

As a small library, Cassie exposes few things, all properly contained
under the ``cassie`` namespace. If you're running Cassie in an
environment that doesn't offer support for CommonJS modules, Cassie will
create a new namespace inside the global (usually ``window``)
object. Otherwise, you just bind the exported data to whatever variable
you want.


module *Cassie*
---------------

.. attribute:: Obj forgotten: { }

  A constant that indicates the :class:`Promise` has failed through a call
  to :func:`forget`.


.. attribute:: Obj timeouted: { }

  A constant that indicates the Promise failed for running out of its
  allowed time.


.. function:: clean() -> Obj

  Restores the value of the global ``cassie`` property before Cassie
  was defined, and returns a reference to Cassie.

  You can use this function as a workaround in the unlike event that
  the global ``cassie`` has already been taken. Or just to have a local
  reference to it instead of letting it pollute your globals:

  .. code-block:: html

     <script type="text/javascript">
         window.cassie = "Cassandra"
     </script>
     <script type="text/javascript" src="cassie.js"></script>
     <script type="text/javascript">
         cassie // { clean: function() { ... }, ... }
         var future = cassie.clean()
         cassie // "Cassandra"
     </script>

  .. warning::
     This method is only available on environments that doesn't support
     CommonJS modules. It's not provided in Node.js and such
     environments.   


object *Promise*
----------------

.. class:: Promise

   Creates a deferred object, which can be manipulated before the value
   it refers to is actually resolved. As soon as the :class:`Promise` is
   fulfilled, all pending actions will be applied.

   You can either return the promise directly, or take full advantage of
   it by inheriting the :class:`Promise` prototype and adding your own
   custom methods.

   .. seealso::
   
      :doc:`advanced` for more information on how the :class:`Promise`
      works and how you can extend it.

   
Attributes
''''''''''

Although the attributes for :class:`Promise` are exposed, you shouldn't
manipulate them directly. As such, these are considered internal and may
have its behaviour changed without prior warning.


.. attribute:: Obj callbacks: { }
      
   A map of ``event → callbacks`` that the :class:`Promise` knows
   about.


.. attribute:: Array flush_queue: [ ]
      
   A list of events that will have their list of callbacks flushed as
   soon as the Promise's value is resolved.


.. attribute:: Obj value: null

   The value of the :class:`Promise`. Any falsy value indicates that the
   Promise hasn't been resolved yet.

   The resolution function will always set the value as an array of
   arguments, which will in turn be passed to the callbacks waiting
   for the resolution of the Promise.


.. attribute:: Num timer: null

   A timer ID returned by :func:`timeout`.


.. attribute:: Str defaultev: 'done'

   The queue on which callbacks are added by default, when an event
   queue is not explicitly passed to :func:`add`.


Prototype methods
'''''''''''''''''

.. method:: add([Str event][, Fn callback]) -> Promise

   Adds a callback to the :class:`Promise` and changes the default event
   queue.

   :param Str event:
       The event queue to which the callback should be added.
   :param Fn callback(args...):
       A function that should be called when this event happens. Such
       function will take as its parameters the value of the
       :class:`Promise`.
       
Both parameters for the :func:`add` method are optional.

Should ``event`` not be given, the :class:`Promise` will just use the
default event queue (:attr:`defaultev`), and place the callback
there. Having this default queue allows less repeating yourself all over
the place::

    // foo, bar and baz are added to queue 'ok'
    promise.add('ok').add(foo).add(bar).add(baz)


On the other hand, if the callback is not given, the function will just
change the default event queue to the given ``event``.

And, obviously, if neither arguments are given, the function won't do
anything.

The :func:`add` is quite *"low-level"* though, and the specialised
functions should be preferred when available (:func:`ok`,
:func:`failed`, etc).



.. method:: flush(Str event) -> Promise

   Calls all callbacks associated with the given event.

   :param Str event: the event queue to flush.

The flush method does two different things, depending on whether the
:class:`Promise` has been resolved or not. If the promise still hasn't a
value, this method will add the event to the
:attr:`flush_queue`. Otherwise, it'll fire all the callbacks for the
events in the :attr:`flush_queue`, then clear the queue.

Callbacks are called in the context of the current :class:`Promise`,
with the promise's value array applied as the callback arguments.



.. method:: done(Arrayish values) -> Promise
   
   Resolves the :class:`Promise` to the given values and flushes the
   callbacks defined for ``done``.

   :param Arrayish values:
       Any array-like object to be passed as arguments to the
       callbacks.

   :fires: ``done``

The given ``values`` array-like object is cloned by simple applying
``Array.prototype.slice`` to it. This makes it easier for caller
functions to just pass the ``arguments`` object straight up into this
method.

If the :class:`Promise` has already been resolved, this method does
nothing, otherwise it'll flush all callbacks in the :attr:`flush_queue`,
plus the ``done`` event queue.

Done is the lowest level of Promise resolution, and shouldn't really be
called directly (unless you want to introduce a new class of primitive
Promise state). Instead, take a look at :func:`bind` and :func:`fail`.

.. seealso::
   :ref:`Specialised states` for an explanation of the order in which
   these callback queues are flushed.



.. method:: fail(Obj error) -> Promise

   Fails to fulfill the promise, 

   :param Obj error: An object describing why the function error'd.
   :fires: ``fail``

This function is used to indicate that a function can't be fulfilled,
and as such any callback waiting for the function to error should be
called.

Fail is a low-level, general error routine. For more specialised methods
see :func:`timeout` and :func:`forget`.

.. seealso::
   :func:`done` for information on how the callbacks are flushed.



.. method:: bind(values...) -> Promise

   Successfully fulfills the :class:`Promise`.

   :param values:
       Positional parameters to be passed to all callbacks waiting for
       this :class:`Promise` to be resolved.
   :fires: ``ok``



.. method:: timeout(Num delay) -> Promise

   Fails to fulfill the :class:`Promise` after the given number of
   seconds.

   :param Num delay:
       The number of seconds to wait before failing to fulfill this
       :class:`Promise`.
   :fires: ``timeouted``

This method will fail to fulfill the :class:`Promise` with the value of
:attr:`timeouted`. Callbacks bound to ``fail`` can analyse the parameter
to see why the :class:`Promise` failed.



.. method:: clear_timer() -> Promise

   Clears any timer that may have been set with :func:`timeout`.



.. method:: forget() -> Promise

   Immediately fails to fulfill the :class:`Promise`.

   :fires: ``forgotten``

This method will fail to fulfill the :class:`Promise` with the value of
:attr:`forgotten`. Callbacks bound to ``fail`` can analyse the parameter
to see why the :class:`Promise` failed.


Specialised states
''''''''''''''''''

These methods are simply a syntatic sugar for :func:`add`. They add a
single callback to a specific queue, and change the default queue to
that.

.. seealso:: :func:`add` for information on queues.


.. method:: ok(Fn callback) -> Promise

   Adds a callback to the ``ok`` queue.


.. method:: failed(Fn callback) -> Promise

   Adds a callback to the ``failed`` queue.


.. method:: timeouted(Fn callback) -> Promise

   Adds a callback to the ``timeouted`` queue.


.. method:: forgotten(Fn callback) -> Promise

   Adds a callback to the ``forgotten`` queue.
