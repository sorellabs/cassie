Getting Started
===============

This page is meant as a really quick'n'dirty introduction to
Cassie. It'll walk you through the basics to get it up and running — to
take advantage of all its awesomeness, be sure to :doc:`peer into the
depths <advanced>`.


What you'll need
----------------

Be sure to `download the lastest snapshot`_ or clone the git
repository::

    $ git clone git://github.com/killdream/cassie.git

The file that you want for now is ``src/cassie.js``.

.. _download the lastest snapshot: https://github.com/killdream/cassie/zipball/master


"Installing"
------------

To install Cassie on some page that'll run on a browser, you just stick
it at the right end of your ``<body>`` tag. `This will also ensure that
your pages load faster`_:

.. code-block:: html

    <!DOCTYPE html>
    <html>
    <head> <!-- ... --> </head>
    <body>
        <!-- ... -->
        <script src="path/to/jello.js"></script>
        <script src="path/to/your/other/jsfiles.js"></script>
    </body>
    </html>

If you want to use it somewhere that supports CommonJS modules (like
Node.js), even easier: just ``require`` it::

    var cassie = require('/path/to/cassie') // without .js

.. _This will also ensure that your pages load faster: http://developer.yahoo.com/performance/rules.html#js_bottom


Basic Usage
-----------

Now that you have your scripts in place, you can have a sneaky-peak in
the awesomeness. Let's see how you can bend your asynchronous calls in
sweet Promises.

First, we'll define a simple asynchronous function. This function does
nothing aside of calling its callbacks in a few seconds. The usual way
is just to have a function that gets a callback as argument::

    function delay(seconds, callback) {
        setTimeout(function(){ callback(seconds) }
                  ,seconds * 1000)
    }

Now, notice how you can ever only pass a single callback to the
function, and once you've done that, it's over. No way of doing anything
else with it.

But what if we could not only add several callbacks to it (even after
the function has returned), but also define a maximum of time these
callbacks would wait for it? Guess what: Cassie allows you to do that::

    function delay(seconds) {
        // Make a Promise
        var promise = new cassie.Promise

        // Plan when you'll honour that Promise
        setTimeout(function() {
            // When the time is right, honour the promise!
            promise.bind(seconds)
        }, seconds * 1000)

        // And let people know a promise has been made!
        return promise
    }

Basically those are the four steps you'll ever need. First you make a
Promise to Cassie. Then you decide how you'll honour that Promise —
don't worry, little `Cassandra`_ is a prophet, she knows of the
Future. Last but not least, you return this Promise, so other people can
find out about it, and plan their lives around it :3

The last step is actually honouring your promise, which is done through
the arcane spell ``bind``. This will magically transmit all the things
you've told Cassie to everyone that was waiting for the outcome of that
Promise.

Unfortunatelly, sometimes you will not be able to honour your promises —
though if they depend only on you, you're doing something wrong! — For
those cases, you can simply tell the world how you're sorry, and what
has gone wrong through the arcane spell ``fail``.

Both accept any number of excuses/joys (which some dare call
``arguments``) and will happily pass them all along.


.. _Cassandra: http://en.wikipedia.org/wiki/Cassandra


All nice... but now what?
'''''''''''''''''''''''''

Well, now you can go around doing things, and tell the world to watch
out for them. First, let's just see how you can tell people that you
have premonitions::

    var task = delay(2).ok(function() {
        alert('I haz premonitions') })

    function tell_other_guy(task) {
        task.ok(function() {
            alert('Whoa, awesum\'') })}

    tell_other_guy(task)


Running it you'll see two alert boxes on the screen, after two
seconds. The first one says *"I has premonitions*" and the second one
*"Whoa, awesum'*". But hey, they all rely on the promise being
successfully honoured, and sometimes this may not be the case.

.. note::
   If you're running this outside of the browser, you'll need to map
   alert to some function that outputs text. It may be ``console.log``
   (like in Node.js) or ``print`` (like Rhino).

   So whenever you see alert, just replace it by one of these
   functions.


What if shit happens?
'''''''''''''''''''''

If by any chance you can't honour your promise, people need a way of
dealing with it. Fortunately, in Cassie this is handled as easily and
straight forward as the success cases::

    delay(2).ok(function() {
                alert(42) }) // never happens
            .failed(function() {
                alert('What was that again?') })
            .forget()

This will quickly prompt you with *"What was that again?*". You can
forget your promises when you need to, just be sure you have a reason
for this — promises are important!


But why so harsh?!
''''''''''''''''''

As you see, you can quickly forget your promises, but sometimes that's
just so harsh. What if you want to give your promise a little bit of
time before saying *"I don't care"*?

Well, rest assurred my friend, because you can. And it's just as simple
as forgetting your promises::

    delay(4).failed(function(why) {
                if (why === cassie.timeouted)
                    alert("Oh shit, can't wait anymoar") })
            .timeout(2)


.. note::
   Cassie provides the functions ``timeouted`` and ``forgotten`` as more
   specialised kinds of ``failed`` callbacks.


Where to go from here?
----------------------

Hell yeah motherfucker, this is some hot stuff... but why the example on
the :doc:`overview` page looks **so damn more awesome**?

Well, it's because this is just the starting point. Cassie is designed
to provide just the essential tools out of the box, so people can extend
it easily to suit their needs.

And when you realise you need the additional power, it's about time you
should :doc:`peer into the depths <advanced>`.
