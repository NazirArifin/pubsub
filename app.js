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
  `mqtt://broker.hivemq.com:1883`,
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
        await conn.query("INSERT INTO tbl_air VALUES (NULL, ?, ?, NOW())", [nilai.tinggiAir, nilai.persentase]);
      }
      if (topic === 'tinggi/nutrisi') {
        await conn.query("INSERT INTO tbl_nutrisi VALUES (NULL, ?, ?, NOW())", [nilai.tinggiNutrisi, nilai.persentase]);
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

async function checkSiram(tanggal, jam) {
  // check ke database
  try {
    const conn = await pool.getConnection();
    const data = await conn.query("SELECT id_siram FROM tbl_siram_air WHERE DATE(time) = ? AND siram_air = ? AND HOUR(time) = ?", [tanggal, 1, jam]);
    if (data.length == 0) {
      client.publish('kondisi/air', JSON.stringify({ siramError: 1 }));
    }
    conn.end();
  } catch (error) {
    console.log(error);
  }
}

let counter = 0;
let currentDate = '';
let morningMinuteChecks = [];
let eveningMinuteChecks = [];

function checkDate() {
  const date = new Date();
  // today's date
  const today = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  if (today !== currentDate) {
    currentDate = today;
    morningMinuteChecks = [];
    eveningMinuteChecks = [];
  }

  // try to check at minute 20, 25 and 30 at 7 o'clock
  const minute = date.getMinutes();
  if (date.getHours() === 7 && (minute === 20 || minute === 25 || minute === 30)) {
    if (!morningMinuteChecks.includes(minute)) {
      checkSiram(today, 7);
      morningMinuteChecks.push(minute);
    }
  }
  // try to check at minute 20, 25 and 30 at 17 o'clock
  if (date.getHours() === 17 && (minute === 20 || minute === 25 || minute === 30)) {
    if (!eveningMinuteChecks.includes(minute)) {
      checkSiram(today, 17);
      eveningMinuteChecks.push(minute);
    }
  }
  
  clearInterval(counter);
  counter = setInterval(checkDate, 3000);
}

checkDate();
counter = setTimeout(() => checkDate(), 3000);