import mqtt from 'mqtt';

const client = mqtt.connect(
  `mqtt://test.mosquitto.org:1883`,
  {
    clientId: 'mqtt_' + Math.random().toString(16).slice(3),
    clean: true,
    connectTimeout: 4000,
    username: 'emqx',
    password: 'public',
    reconnectPeriod: 1000
  } 
);

client.on('connect', () => {
  console.log('connected');
  client.subscribe(['air/tinggi'], () => {
    console.log('subscribed');
  }).on('message', (topic, message) => {
    console.log(topic, message.toString());
  });
});