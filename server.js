const express = require('express');
const mysql = require('mysql');
var cors = require('cors');

const { query } = require('express');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'rs-bj'
});

connection.connect();

app.get('/', (req, res) => {
  let query = 'select nik, nama, date_format(tanggal_lahir, "%M %d %Y") as tanggal_lahir, alamat, layanan from pasien';
  connection.query(query, (err, rows, fields) => {
    if(err) throw err
    res.send(rows);
  })
})

app.post('/add', (req, res) => {
  console.log(req.body);
  const { nik, nama, tanggal_lahir, alamat, layanan } = req.body;
  let query = `insert into pasien (nik, nama, tanggal_lahir, alamat, layanan) values (${ nik }, '${ nama }', '${tanggal_lahir}', '${ alamat }', '${layanan}')`;
  connection.query(query, (err, rows, fields) => {
    if(err) throw err
    res.send({
      success: true,
      rows
    });
  })
})

app.get('/delete/:nik', (req,res) => {
  let { nik } = req.params;
  let query = `delete from pasien where nik=${nik}`;
  connection.query(query, (err, rows, fields) => {
    if(err) throw err
    res.send({
      success: true,
    })
  })
})

app.get('/:nik', (req, res) => {
  let { nik } = req.params;
  let query = `select nik, nama, date_format(tanggal_lahir, "%M %d %Y") as tanggal_lahir, alamat, layanan from pasien where nik=${nik}`;
  connection.query(query, (err, rows, fields) => {
    if(err) throw err
    console.log(`rows[0]`, rows[0]);
    res.send(rows[0]);
  })
})

app.post('/edit/:nik_lama', (req, res) => {
  let {nik_lama} = req.params;
  const { nama, tanggal_lahir, alamat, nik } = req.body;
  let query = `UPDATE pasien SET nik=${nik}, nama = '${nama}', tanggal_lahir = '${ tanggal_lahir }', alamat = '${alamat}' WHERE nik = ${nik_lama}`
  connection.query(query, (err, rows, fields) => {
    if(err) throw err
    res.send({
      success: true,
      rows
    });
  })
})


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});