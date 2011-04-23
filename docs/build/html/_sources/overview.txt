Overview
========

Cassie is a short and self contained library that adds support for
*Futures* in JavaScript. It's designed to stand on its own and allow
people to extend it to fit their needs.


Why use it?
-----------

JavaScript is a deemed asynchronous language, specially since most of it
is run inside the browser, and its single threaded model — which shares
the thread with UI rendering as well, — makes event driven programming
the only reasonable choice.

Unfortunately this most of the time leads to clusterfucks of
callbacks. And it looks **ugly**::

    req.onreadystatechange = function(ev) {
        if (req.readyState == 4 && req.status == 200) {
            var text = req.responseText
            !function() {
                setTimeout(function() {
                    text = do_processing(text)
                    view.insert(text)
                }, 500) }() }
    }

With promises, you could achieve this::

    req.ok().until('processed')
            .process_data()
            .delay(500)

Though as a general library Cassie doesn't provide you with all that set
of functions, it allows you to quickly extend it to implement them, so
you can take advantage of the abstraction to write more readable code.


Supported Platforms
-------------------

Cassie runs on any platform that supports ECMAScript 3. This includes
all the popular browsers: IE 6+, Chrome, Safari, Opera and Firefox. But
also the non-browser stuff: Node.js, Narwhal, Rhino and such.

CommonJS modules, where supported, are used to provide nice
modularization for the code. On browser environments, Cassie will take
hold of the ``window.cassie`` variable to dump its code, and provide a
nice method ``cassie.clean()`` to revert the global value if needed.


.. note::
   I have only actually tested the code on v8 (Chrome and Node.js) and
   SpiderMonkey (Firefox). Proper testing on other platforms will be
   done when I write proper test cases.


Obtaining Cassie
----------------

Cassie is nicely hosted (and developed) on `Github`_. You can `download
the lastest snapshot`_ or clone the entire repository::

    $ git clone git://github.com/killdream/cassie.git


.. _Github: https://github.com/killdream/cassie
.. _download the lastest snapshot: https://github.com/killdream/cassie/zipball/master


Getting Support
---------------

**To report bugs or request features:**
    Use the `Github bugtracker`_. Like a boss!

**To get general support:**
    You can send me an e-mail on quildreen@gmail.com. You can
    send me spam as well, but then I'd have to kill you \*puts on
    scary-looking face >:3\*

.. _Github bugtracker: https://github.com/killdream/cassie/issues



Licence
-------

.. include:: ../../LICENCE.txt
