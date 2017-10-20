// Copy this file as config.js and replace at least the connectionstring value


var config = {}

// String containing Hostname, Device Id & Device Key in the following formats:
//  "HostName=<iothub_host_name>;DeviceId=<device_id>;SharedAccessKey=<device_key>"
config.connectionString = '[IoT device connection string]';

// Send message interval per device (milliseconds)
config.sendInterval = 15000;

module.exports = config;