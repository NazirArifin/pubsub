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
  client.subscribe(['air/tinggi'], () => {
    console.log('subscribed');
  }).on('message', async (topic, payload) => {
    const nilai = JSON.parse(payload);
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query("INSERT INTO tbl_air VALUES (NULL, ?, NOW())", [nilai.tinggiAir]);
      conn.end();
    } catch (error) {
      console.log(error);
    }
  });

  // client.subscribe(['nutrisi/tinggi'], () => {
  //   console.log('subscribed');
  // }).on('message', async (topic, payload) => {
  //   const nilai = JSON.parse(payload);
  //   let conn;
  //   try {
  //     conn = await pool.getConnection();
  //     await conn.query("INSERT INTO tbl_nutrisi VALUES (NULL, ?, NOW())", [nilai.tinggiNutrisi]);
  //     conn.end();
  //   } catch (error) {
  //     console.log(error);
  //   }
  // });

  // client.subscribe(['air/kondisi'], () => {
  //   console.log('subscribed');
  // }).on('message', async (topic, payload) => {
  //   const nilai = JSON.parse(payload);
  //   let conn;
  //   try {
  //     conn = await pool.getConnection();
  //     await conn.query("INSERT INTO tbl_siram_air VALUES (NULL, ?, NOW())", [nilai.siram_air]);
  //     conn.end();
  //   } catch (error) {
  //     console.log(error);
  //   }
  // });

  // client.subscribe(['nutrisi/kondisi'], () => {
  //   console.log('subscribed');
  // }).on('message', async (topic, payload) => {
  //   const nilai = JSON.parse(payload);
  //   let conn;
  //   try {
  //     conn = await pool.getConnection();
  //     await conn.query("INSERT INTO tbl_siram_nutrisi VALUES (NULL, ?, NOW())", [nilai.siram_nutrisi]);
  //     conn.end();
  //   } catch (error) {
  //     console.log(error);
  //   }
  // });
});