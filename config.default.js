var config = {}

// String containing Hostname, Device Id & Device Key in the following formats:
//  "HostName=<iothub_host_name>;DeviceId=<device_id>;SharedAccessKey=<device_key>"
config.connectionString = '[IoT device connection string]';

// Collect advertisements and send then in batches wit this interval (milliseconds)
config.batchInterval = 5000;

module.exports = config;