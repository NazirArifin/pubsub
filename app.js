import mqtt from 'mqtt';
import mariadb from 'mariadb';

const pool = mariadb.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database:'db_sirlon',
  connectionLimit: 5
});

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
  client.subscribe([
    'tinggi/air',
    'tinggi/nutrisi',
    'kondisi/air',
    'kondisi/nutrisi',
  ], () => {
    console.log('subscribed');
  }).on('message', async (topic, payload) => {
    if(Buffer.isBuffer(payload)){
      payload = payload.toString();
    }
    const nilai = JSON.parse(payload);
    let conn;
    try {
      conn = await pool.getConnection();
      if (topic === 'tinggi/air') {
        await conn.query("INSERT INTO tbl_air VALUES (NULL, ?, ?, NOW())", [nilai.tinggiAir, nilai.presentase]);
      }
      if (topic === 'tinggi/nutrisi') {
        await conn.query("INSERT INTO tbl_nutrisi VALUES (NULL, ?, ?, NOW())", [nilai.tinggiNutrisi, nilai.presentase]);
      }
      if (topic === 'kondisi/air') {
        await conn.query("INSERT INTO tbl_siram_air VALUES (NULL, ?, NOW())", [nilai.siramAir]);
      }
      if (topic === 'kondisi/nutrisi') {
        await conn.query("INSERT INTO tbl_siram_nutrisi VALUES (NULL, ?, NOW())", [nilai.siramNutrisi]);
      }
      
      conn.end();
    } catch (error) {
      console.log(error);
    }
  });
});