var mysql = require('mysql');
var dbCon = mysql.createConnection({
    host: 'localhost',
    user: 'Nodejs',
    password: '12345678',
    database: 'opentutorials'
  });
  dbCon.connect();

  module.exports = dbCon;