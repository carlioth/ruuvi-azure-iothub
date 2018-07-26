(function () {
  'use strict';

  const ruuvi = require('node-ruuvitag');
  var Protocol = require('azure-iot-device-amqp').Amqp;
  var Client = require('azure-iot-device').Client;
  var Message = require('azure-iot-device').Message;

  var config = require('./config');
  var tagMapper = require('./tag-mapper');



  var messageStore = {};

  // fromConnectionString must specify a transport constructor, coming from any transport package.
  var client = Client.fromConnectionString(config.connectionString, Protocol);

  var connectCallback = function (err) {
    if (err) {
      console.error('Could not connect: ' + err.message);
      setTimeout(function () { client.open(connectCallback); }, 10000);
    } else {
      console.log('Client connected');
      client.on('message', function (msg) {
        console.log('Id: ' + msg.messageId + ' Body: ' + msg.data);
        // When using MQTT the following line is a no-op.
        client.complete(msg, printResultFor('completed'));
        // The AMQP and HTTP transports also have the notion of completing, rejecting or abandoning the message.
        // When completing a message, the service that sent the C2D message is notified that the message has been processed.
        // When rejecting a message, the service that sent the C2D message is notified that the message won't be processed by the device. the method to use is client.reject(msg, callback).
        // When abandoning the message, IoT Hub will immediately try to resend it. The method to use is client.abandon(msg, callback).
        // MQTT is simpler: it accepts the message by default, and doesn't support rejecting or abandoning a message.
      });

      client.on('error', function (err) {
        console.error(err.message);
        clearInterval(sendInterval);
        client.removeAllListeners();
        client.open(connectCallback);
      });

      client.on('disconnect', function () {
        clearInterval(sendInterval);
        client.removeAllListeners();

        setTimeout(function () { client.open(connectCallback); }, 10000);
        //client.open(connectCallback);
      });
    }
  };

  client.open(connectCallback);

  // Helper function to print results in the console
  function printResultFor(op) {
    return function printResult(err, res) {
      if (err) console.log(op + ' error: ' + err.toString());
      if (res) console.log(op + ' status: ' + res.constructor.name);
    };
  }

  // Create a message and send it to the IoT Hub with configured interval
  var sendInterval = setInterval(function () {
    console.log("Checking buffer for messages")
    for (var device in messageStore) {
      var deviceId = device;
      var message = messageStore[device];

      // remove from buffer so that it does not get sent multiple times (if tag connection is lost)
      delete messageStore[device];

      console.log('Sending message: ' + message.getData());
      client.sendEvent(message, printResultFor('send'));

    }
  }, config.sendInterval);

  // Set up ruuvitag event handlers
  ruuvi.on('found', tag => {
    console.log('Found RuuviTag, id: ' + tag.id);

    tag.on('updated', data => {
      var deviceId = 'ruuvi-' + tag.id;
      var timestamp = new Date();
      var time = timestamp.toISOString();

      // console.log('Got data from RuuviTag ' + tag.id + ':\n' + JSON.stringify(data, null, '\t'));
      var messageData = JSON.stringify({
        "deviceId": deviceId,
        "tagFriendlyName": tagMapper[tag.id],
        "rssi": data.rssi,
        "humidity": data.humidity,
        "temperature": data.temperature,
        "pressure": data.pressure,
        "accelerationX": data.accelerationX,
        "accelerationY": data.accelerationY,
        "accelerationZ": data.accelerationZ,
        "battery": data.battery,
        "time": time
      });
      var message = new Message(messageData);
      messageStore[tag.id] = message;
    });
  });

})();
