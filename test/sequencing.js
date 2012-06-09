describe('λ cassie.sequencing', function() {
  var ensure = require('noire').ensure
  var sinon = require('sinon')
  var Promise = require('../src/cassie').Promise
  var sequentially = require('../src/sequencing')

  function delay(time, f) { return function() {
    var p = Promise.make().ok(f)
    setTimeout( function() { p.bind(time) }
              , time )
    return p }}


  it('Given no tasks, should succeed immediately.', function(done) {
    var spy = sinon.spy()
    sequentially().ok(done)
                  .failed(function(){ throw Error("Failed.") })
  })

  it('Should do each task in order.', function(done) {
    var spy = sinon.spy()
    sequentially( delay(200, spy)
                , delay(100, spy)
                , delay(50, spy))
      .on('done', function() {
        ensure(spy.getCall(0).args).equals([200])
        ensure(spy.getCall(1).args).equals([100])
        ensure(spy.getCall(2).args).equals([50])
        done() })
  })
})