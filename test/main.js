var expect = require('expect.js')

describe('{} cassie', function() {
  var proto      = Object.getPrototypeOf
  var coverage_p = process.env && process.env.MOCHA_TEST_COV
  var cov_lib    = '../src-cov/cassie'
  var cassie     = coverage_p?      require(cov_lib)
                 : /* otherwise */  require('../src/cassie')

  var promise = cassie.Promise.make.bind(cassie.Promise)
  var f = function() { evoke.push('f') }
  var g = function() { evoke.push('g') }
  var evoke = []

  beforeEach(function() {
    evoke = []
  })

  describe('λ register', function() {
    it('Should return a function.', function() {
      expect(cassie.register('foo')).to.be.a('function')
    })
    it('Should call the `on\' method passing the curried event and the function.', function() {
      var o = { on: function(a, b){
                      expect(a).to.be('foo')
                      expect(b).to.be(f) }
              , test: cassie.register('foo') }
      o.test(f)
    })
  })

  describe('{} Promise', function() {
    describe('λ init', function() {
      it('Should initialize a new promise instance.', function() {
        expect(proto(promise())).to.be(cassie.Promise)
      })
      it('Should match the Promise interface.', function() {
        var p = promise()
        expect(p.callbacks).to.be.an('object')
        expect(p.flush_queue).to.be.an('array')
        expect(p.default_event).to.be.a('string')
      })
    })

    describe('λ on', function() {
      it('Should set the default event to the one passed in the function.', function() {
        var p = promise().on('foo', f)

        expect(p.default_event).to.be('foo')
      })
      it('Should invoke the callback if the event queue has been flushed.', function() {
        var p = promise()
        p.callbacks.foo = []
        p.callbacks.foo.flushed = true

        p.on('foo', function(){ expect(true).to.be.ok() })
      })
      it('Should queue the callback if the event queue hasn\'t been flushed.', function() {
        var p = promise().on('foo', f)

        expect(p.callbacks.foo[0]).to.be(f)
      })
    })

    describe('λ then', function() {
      it('Should return a new promise.', function() {
        var p = promise()
        expect(p).to.not.be(p.then())
        expect(p.isPrototypeOf(p.then())).to.be.ok()
      })
      it('Should succeed when the original promise suceeds.', function() {
        var p = promise()
        p.then(function(){}).ok(f).failed(g)
        p.bind()
        expect(evoke).to.eql(['f'])
      })
      it('Should fail when the original promise fails.', function() {
        var p = promise()
        p.then(function(){}).ok(f).failed(g)
        p.fail()
        expect(evoke).to.eql(['g'])
      })
      it('Should transform the bound value by the given functor.', function() {
        var p = promise()
        p.then(function(x){ return x * x })
         .ok(function(x){ expect(x).to.be(4) })
        p.bind(2)
      })
      it('Should flush all the queues flushed by the origin.', function() {
        var p = promise()
        p.then(function(){}).on('foo', f).on('bar', g)
        p.flush('foo').flush('bar').bind()
        expect(evoke).to.eql(['f','g'])
      })
      it('Should have its own callback mapping.', function() {
        var p = promise()
        expect(p.then().callbacks).to.not.be(p.callbacks)
      })
      it('Should share the flush queue with the original promise.', function() {
        
      })
/*
      it('Should use the default_event queue.', function() {
        var p = promise().on('foo', f).then(g)

        expect(p.callbacks.foo).to.eql([f, g])
      })
*/
    })

    describe('λ flush', function() {
      it('Should queue if the promise hasn\'t been resolved.', function() {
        var p = promise().flush('ok')

        expect(p.flush_queue).to.eql(['ok'])
      })
      it('Should invoke all the callbacks in the queue if an event is given.', function() {
        var p = promise().on('foo', f).on('bar', g).bind().flush('foo')

        expect(evoke).to.eql(['f'])
        expect(p.callbacks.bar.flushed).to.not.be.ok()
      })
      it('Should invoke all flushed events if an event is not given.', function() {
        var p = promise().on('foo', f).on('bar', g).on('baz', f).on('baz', g)
                         .flush('foo').flush('bar')
        p.value = []
        p.flush()

        expect(evoke).to.eql(['f', 'g'])
        expect(p.callbacks.foo.flushed).to.be.ok()
        expect(p.callbacks.bar.flushed).to.be.ok()
      })
      it('Should call any registered function at most once.', function() {
        var p = promise().on('foo', f).bind().flush('foo').flush()

        expect(evoke).to.eql(['f'])
      })
    })

    describe('λ done', function() {
      it('Shouldn\'t do anything if the promise has been resolved.', function() {
        var p = promise().done([])
                         .on('foo', g).done([1])

        expect(evoke).to.eql([])
        expect(p.value).to.eql([])
      })
      it('Should set the promise\'s value to the given list of values.', function() {
        var p = promise().done([1])

        expect(p.value).to.eql([1])
      })
      it('Should flush all of the previous queued event queues.', function() {
        var p = promise().on('foo', f).on('bar', g).flush('foo').done([])

        expect(evoke).to.eql(['f'])
      })
    })

    describe('λ fail', function() {
      it('Should resolve the promise with an error.', function() {
        var p = promise().failed(f).ok(g).fail(1)

        expect(evoke).to.eql(['f'])
      })
      it('Should use the arguments as the value of the promise.', function() {
        var p = promise().fail(1)

        expect(p.value).to.eql([1])
      })
    })

    describe('λ bind', function() {
      it('Should resolve the promise with success.', function() {
        var p = promise().failed(f).ok(g).bind(1)

        expect(evoke).to.eql(['g'])
      })
      it('Should use the arguments as the value of the promise.', function() {
        var p = promise().bind(1)

        expect(p.value).to.eql([1])
      })
    })

    describe('λ forget', function() {
      it('Should resolve the promise with a `forgotten\' error.', function() {
        var p = promise().failed(function(v){ expect(v).to.be('forgotten') })
                         .forgotten(f)
                         .forget()

        expect(evoke).to.eql(['f'])
        expect(p.value).to.eql(['forgotten'])
      })
    })

    describe('λ timeout', function() {
      it('Should resolve the promise with a `timeout\' error, after the delay.', function(n) {
        var d = new Date
        var p = promise().failed(function(v){ expect(v).to.be('timeouted') })
                         .timeouted(f)
                         .timeouted(function(){ expect(new Date - d).to.be.above(900)
                                                expect(evoke).to.eql(['f'])
                                                expect(p.value).to.eql(['timeouted'])
                                                n() })
                         .timeout(1)
      })
      it('Should cancel all previous timeouts.', function(n) {
        var d = new Date
        var p = promise().timeout(1).timeout(1.5)
                         .timeouted(function(){ expect(new Date - d).to.be.above(1400)
                                                n() })
      })
    })

    describe('λ clear_timer', function() {
      it('Should cancel all previous timeouts.', function(n) {
        var d = new Date
        var p = promise().timeout(1)
                         .clear_timer()
                         .failed(f).ok(g)
        setTimeout( function() { p.bind(1)
                                 expect(new Date - d).to.be.above(1400)
                                 expect(p.value).to.eql([1])
                                 expect(evoke).to.eql(['g'])
                                 n() }
                  , 1500 )
      })
    })
  })
})