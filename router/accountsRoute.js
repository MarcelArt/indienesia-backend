const express = require('express');
let router = express.Router();

router.get('/:id', (req, res) => {
  connection.query(`select * from accounts where account_id = ${req.params.id}`, (err, rows, fields) => {
    res.send(rows);
  })
})

module.exports = router;