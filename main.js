var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var template = require('./lib/template.js')
var sanitizeHtml = require('sanitize-html')
var mysql = require('mysql');
var dbCon = mysql.createConnection({
  host: 'localhost',
  user: 'Nodejs',
  password: '12345678',
  database: 'opentutorials'
});
dbCon.connect();

var app = http.createServer(function (request, response) {
  var _url = request.url;
  var queryData = url.parse(_url, true).query;
  var pathname = url.parse(_url, true).pathname;

  if (pathname === '/') {
    if (queryData.id === undefined) {
      dbCon.query(`select * from topic`, function (error, topics) {
        console.log(topics);
        var title = 'Welcome';
        var description = 'Hello, Node.js';
        var list = template.list(topics);
        var html = template.HTML(title, list,
          `<h2>${title}</h2>${description}`,
          `<a href="/create">create</a>`);
        response.writeHead(200);
        response.end(html);
      })
    } else {
      dbCon.query(`select * from topic`, function (error, topics) {
        if (error) {
          throw error;
        }
        dbCon.query(`select * from topic where id=?`, [queryData.id], function (errorSec, topic) {
          if (errorSec) {
            throw errorSec;
          }
          var title = topic[0].title;
          var description = topic[0].description;
          var list = template.list(topics);
          var html = template.HTML(title, list,
            `<h2>${title}</h2>${description}`,
            `<a href="/create">create</a>
            <a href="/update?id=${queryData.id}">update</a>
            <form action="delete_process" method="post">
              <input type="hidden" name="id" value="${queryData.id}">
              <input type="submit" value="delete">  
            </form>`);
          response.writeHead(200);
          response.end(html);
        })
      })
    }
  } else if (pathname === '/create') {
    dbCon.query(`select * from topic`, function (error, topics) {
      var title = 'Create';
      var list = template.list(topics);
      var html = template.HTML(title, list,`
        <form action="/create_process" method = "post">
          <p><input type = "text" name = "title" placeholder="title"></p>
          <p><textarea name = "description" placeholder="description"></textarea></p>
          <p><input type = "submit"></p>
        </form>
        `,
        ` `);
      response.writeHead(200);
      response.end(html);
    })
  } else if (pathname === '/create_process') {
    var body = '';
    request.on('data', function (data) {
      body += data;
    });
    request.on('end', function () {
      var post = qs.parse(body);
      var title = post.title;
      var description = post.description;
      dbCon.query(`
      insert into topic (title, description, created, author_id) 
      values(?, ?, NOW(), ?)`, [post.title, post.description, 1], function(error, results){
        if(error){
          throw error;
        }
        response.writeHead(302, {Location: `/?id=${results.insertId}`});
        response.end();
      })
    });
  } else if (pathname === '/update') {
    fs.readdir('./data', function (err, filelist) {
      fs.readFile(`data/${queryData.id}`, 'utf-8', function (err, description) {
        var title = queryData.id;
        var list = template.list(filelist);
        var html = template.HTML(title, list,
          `
          <form action="/update_process" method = "post">
            <input type = "hidden" name = "id" value = "${title}"
            <p><input type = "text" name = "title" placeholder="title" value = "${title}"></p>
            <p><textarea name = "description" placeholder="description">${description}</textarea></p>
            <p><input type = "submit"></p>
          </form>
          `,
          `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`);
        response.writeHead(200);
        response.end(html);
      });
    });
  } else if (pathname === '/update_process') {
    var body = '';
    request.on('data', function (data) {
      body += data;
    });
    request.on('end', function () {
      var post = qs.parse(body);
      var id = post.id;
      var title = post.title;
      var description = post.description;
      fs.rename(`data/${id}`, `data/${title}`, function (err) {
        fs.writeFile(`data/${title}`, description, 'utf-8', function (err) {
          response.writeHead(302, { Location: `/?id=${title}` });
          response.end();
        });
      });
    });
  } else if (pathname === '/delete_process') {
    var body = '';
    request.on('data', function (data) {
      body += data;
    });
    request.on('end', function () {
      var post = qs.parse(body);
      var id = post.id;
      fs.unlink(`data/${id}`, function (err) {
        response.writeHead(302, { Location: `/` });
        response.end();
      })
    });
  } else {
    response.writeHead(404);
    response.end('Not found');
  }


});
app.listen(3000);