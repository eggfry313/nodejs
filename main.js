var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var template = require('./lib/template.js')
var sanitizeHtml = require('sanitize-html')
var mysql = require('mysql');
const { error } = require('console');
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
        dbCon.query(`select * from topic left join author on topic.author_id=author.id where topic.id=?`, [queryData.id], function (errorSec, topic) {
          if (errorSec) {
            throw errorSec;
          }
          console.log(topic);
          var title = topic[0].title;
          var description = topic[0].description;
          var list = template.list(topics);
          var html = template.HTML(title, list,
            `<h2>${title}</h2>${description}<p>by ${topic[0].name}</p>`,
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
    dbCon.query(`select * from topic`, function(error, topics){
      if(error){
        throw error;
      }
      dbCon.query(`select * from topic where id=?`, [queryData.id], function(errorSec, topic){
        if(errorSec){
          throw errorSec;
        }
        var list = template.list(topics);
        var html = template.HTML(topic[0].title, list,
          `
          <form action="/update_process" method = "post">
            <input type = "hidden" name = "id" value = "${topic[0].id}"
            <p><input type = "text" name = "title" placeholder="title" value = "${topic[0].title}"></p>
            <p><textarea name = "description" placeholder="description">${topic[0].description}</textarea></p>
            <p><input type = "submit"></p>
          </form>
          `,
          `<a href="/create">create</a> <a href="/update?id=${topic[0].id}">update</a>`);
        response.writeHead(200);
        response.end(html);
      })
    })
  } else if (pathname === '/update_process') {
    var body = '';
    request.on('data', function (data) {
      body += data;
    });
    request.on('end', function () {
      var post = qs.parse(body);
      console.log(post);
      dbCon.query('UPDATE topic SET title=?, description=?, author_id=1 WHERE id=?', [post.title, post.description, post.id], function(error, result){
        response.writeHead(302, {Location: `/?id=${post.id}`});
        response.end();
      })
    });
  } else if (pathname === '/delete_process') {
    var body = '';
    request.on('data', function (data) {
      body += data;
    });
    request.on('end', function () {
      var post = qs.parse(body);
      dbCon.query(`delete from topic where id=?`, [post.id], function(error, results){
        if(error){
          throw error;
        }
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