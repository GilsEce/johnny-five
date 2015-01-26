require("es6-shim");

global.IS_TEST_MODE = true;

var MockFirmata = require("./mock-firmata"),
  five = require("../lib/johnny-five.js"),
  sinon = require("sinon"),
  Board = five.Board;


exports["Board.Component"] = {
  setUp: function(done) {

    this.io = new MockFirmata();
    this.board = new Board({
      io: this.io,
      debug: false,
      repl: false
    });
    done();
  },

  tearDown: function(done) {
    Board.purge();
    done();
  },

  callThroughs: function(test) {
    test.expect(5);

    var a = sinon.spy(Board, "mount");
    var b = sinon.spy(Board.Pins, "normalize");
    var opts = {};

    Board.purge();

    var board = new Board({
      io: this.io,
      debug: false,
      repl: false
    });

    Board.Component.call({}, opts);

    test.equal(a.calledOnce, true);
    test.equal(a.getCall(0).args[0], opts);

    test.equal(b.calledOnce, true);
    test.equal(b.getCall(0).args[0], opts);
    test.equal(b.getCall(0).args[1].id, board.id);


    a.restore();
    b.restore();

    test.done();
  },

  emptyOptsInitialization: function(test) {
    test.expect(3);

    var component = new Board.Component();

    test.equal(component.id, null);
    test.equal(component.board, this.board);
    test.equal(component.io, this.io);

    test.done();
  },

  callEmptyOptsInitialization: function(test) {
    test.expect(3);

    var component = {};

    Board.Component.call(component);

    test.equal(component.id, null);
    test.equal(component.board, this.board);
    test.equal(component.io, this.io);

    test.done();
  },

  explicitIdInitialization: function(test) {
    test.expect(1);

    var component = new Board.Component({
      id: "foo"
    });

    test.equal(component.id, "foo");

    test.done();
  },

  callExplicitIdInitialization: function(test) {
    test.expect(1);

    var component = {};

    Board.Component.call(component, {
      id: "foo"
    });

    test.equal(component.id, "foo");

    test.done();
  },

  singlePinInitialization: function(test) {
    test.expect(1);

    var component = new Board.Component({
      pin: 1
    });

    test.equal(component.pin, 1);

    test.done();
  },

  multiPinInitialization: function(test) {
    test.expect(1);

    var component = new Board.Component({
      pins: [1, 2, 3]
    });

    test.deepEqual(component.pins, [1, 2, 3]);

    test.done();
  },

  explicitPinNormalized: function(test) {
    test.expect(1);

    this.board.io.name = "Foo";
    this.board.io.normalize = function(pin) {
      return Math.pow(pin, 2);
    };

    var component = new Board.Component({
      pin: 2
    });

    test.equal(component.pin, 4);

    test.done();
  },

  componentRegistered: function(test) {
    test.expect(2);

    test.equal(this.board.register.length, 0);

    var component = new Board.Component({
      pin: 2
    });

    test.equal(this.board.register.length, 1);

    test.done();
  },

  componentPinOccupiedWarning: function(test) {
    test.expect(5);

    var component = {};

    Board.Component.call(component, {
      pin: 1
    });

    var spy = sinon.spy(component.board, "warn");

    test.equal(component.board.occupied.length, 1);
    test.deepEqual(component.board.occupied[0], {
      value: 1, type: "pin"
    });

    Board.Component.call(component, {
      pin: 1
    });

    test.equal(spy.calledOnce, true);
    test.deepEqual(spy.getCall(0).args, [ "Component", "pin: 1 is already in use" ]);
    test.equal(component.board.occupied.length, 1);

    test.done();
  },

  componentPinAddressOccupiedWarning: function(test) {
    test.expect(7);

    var component = {};

    Board.Component.call(component, {
      pin: 2,
      address: 0x00
    });

    var spy = sinon.spy(component.board, "warn");

    test.equal(component.board.occupied.length, 1);
    test.deepEqual(component.board.occupied[0], {
      value: 2, type: "pin", address: 0x00
    });

    // This SHOULD NOT interfere with the above pin request,
    // as it's a controller specific pin
    Board.Component.call(component, {
      pin: 2
    });

    test.equal(spy.called, false);
    test.equal(component.board.occupied.length, 2);

    // This will be rejected since the pin is already
    // occupied for this address.
    Board.Component.call(component, {
      pin: 2,
      address: 0x00
    });

    test.equal(spy.calledOnce, true);
    test.deepEqual(spy.getCall(0).args, [ "Component", "pin: 2, address: 0 is already in use" ]);
    test.equal(component.board.occupied.length, 2);

    test.done();
  },

  componentPinControllerOccupiedWarning: function(test) {
    test.expect(7);

    var component = {};

    Board.Component.call(component, {
      pin: 3,
      controller: "FOO"
    });

    var spy = sinon.spy(component.board, "warn");

    test.equal(component.board.occupied.length, 1);
    test.deepEqual(component.board.occupied[0], {
      value: 3, type: "pin", controller: "FOO"
    });

    // This SHOULD NOT interfere with the above pin request,
    // as it's a controller specific pin
    Board.Component.call(component, {
      pin: 3
    });

    test.equal(spy.called, false);
    test.equal(component.board.occupied.length, 2);

    // This will be rejected since the pin is already
    // occupied for this controller.
    Board.Component.call(component, {
      pin: 3,
      controller: "FOO"
    });

    test.equal(spy.calledOnce, true);
    test.deepEqual(spy.getCall(0).args, [ "Component", "pin: 3, controller: FOO is already in use" ]);
    test.equal(component.board.occupied.length, 2);

    test.done();
  },

  componentPinAddressControllerOccupiedWarning: function(test) {
    test.expect(7);

    var component = {};

    Board.Component.call(component, {
      pin: 4,
      controller: "FOO",
      address: 0x01
    });

    var spy = sinon.spy(component.board, "warn");

    test.equal(component.board.occupied.length, 1);
    test.deepEqual(component.board.occupied[0], {
      value: 4, type: "pin", controller: "FOO", address: 0x01
    });

    // This SHOULD NOT interfere with the above pin request,
    // as it's a controller specific pin
    Board.Component.call(component, {
      pin: 4
    });

    test.equal(spy.called, false);
    test.equal(component.board.occupied.length, 2);

    // This will be rejected since the pin is already
    // occupied for this controller.
    Board.Component.call(component, {
      pin: 4,
      controller: "FOO",
      address: 0x01
    });

    test.equal(spy.calledOnce, true);
    test.deepEqual(spy.getCall(0).args, [ "Component", "pin: 4, controller: FOO, address: 1 is already in use" ]);
    test.equal(component.board.occupied.length, 2);

    test.done();
  },

  componentAddressControllerNoWarning: function(test) {
    test.expect(3);

    var component = {};

    Board.Component.call(component, {
      controller: "FOO",
      address: 0x01
    });

    var spy = sinon.spy(component.board, "warn");

    // No pins to occupy
    test.equal(component.board.occupied.length, 0);

    Board.Component.call(component, {
      controller: "FOO",
      address: 0x01
    });

    test.equal(spy.called, false);
    test.equal(component.board.occupied.length, 0);
    test.done();
  },

  componentPinsOccupiedWarning: function(test) {
    test.expect(12);

    var component = {};

    Board.Component.call(component, {
      pins: { a: 1, b: 2, c: 3 }
    });

    var spy = sinon.spy(component.board, "warn");

    test.equal(component.board.occupied.length, 3);
    test.deepEqual(component.board.occupied[0], {
      value: 1, type: "pin"
    });

    test.deepEqual(component.board.occupied[1], {
      value: 2, type: "pin"
    });

    test.deepEqual(component.board.occupied[2], {
      value: 3, type: "pin"
    });

    // This will be rejected since the pin is already
    // occupied for this controller.
    Board.Component.call(component, {
      pin: 1
    });

    // This will be rejected since the pin is already
    // occupied for this controller.
    Board.Component.call(component, {
      pin: 2
    });

    // This will be rejected since the pin is already
    // occupied for this controller.
    Board.Component.call(component, {
      pin: 3
    });

    // This will be rejected since the pin is already
    // occupied for this controller.
    Board.Component.call(component, {
      pins: { a: 1, b: 2, c: 3 }
    });

    // 1, 2, 3 + 3
    test.equal(spy.callCount, 6);
    test.deepEqual(spy.getCall(0).args, [ "Component", "pin: 1 is already in use" ]);
    test.deepEqual(spy.getCall(1).args, [ "Component", "pin: 2 is already in use" ]);
    test.deepEqual(spy.getCall(2).args, [ "Component", "pin: 3 is already in use" ]);
    test.deepEqual(spy.getCall(3).args, [ "Component", "pin: 1 is already in use" ]);
    test.deepEqual(spy.getCall(4).args, [ "Component", "pin: 2 is already in use" ]);
    test.deepEqual(spy.getCall(5).args, [ "Component", "pin: 3 is already in use" ]);

    test.equal(component.board.occupied.length, 3);

    test.done();
  },

};
