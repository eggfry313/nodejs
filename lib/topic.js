var url = require('url');
var qs = require('querystring');
var template = require('./template')
var dbCon = require('./dbCon');

exports.home = function(request, response){
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
}

exports.page = function(request, response){
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
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

exports.create = function(request, response){
    dbCon.query(`select * from topic`, function (error, topics) {
        dbCon.query(`select * from author`, function(errorSec, authors){
          var title = 'Create';
          var list = template.list(topics);
          var html = template.HTML(title, list,`
            <form action="/create_process" method = "post">
              <p><input type = "text" name = "title" placeholder="title"></p>
              <p><textarea name = "description" placeholder="description"></textarea></p>
              <p>${template.authorSelect(authors)}</p>
              <p><input type = "submit"></p>
            </form>
            `,
            ` `);
          response.writeHead(200);
          response.end(html);
        })
      })
}

exports.create_process = function(request, response){
    var body = '';
    request.on('data', function (data) {
      body += data;
    });
    request.on('end', function () {
      var post = qs.parse(body);

      dbCon.query(`
      insert into topic (title, description, created, author_id) 
      values(?, ?, NOW(), ?)`, [post.title, post.description, post.author], function(error, results){
        if(error){
          throw error;
        }
        response.writeHead(302, {Location: `/?id=${results.insertId}`});
        response.end();
      })
    });   
}

exports.update = function(request, response){
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    dbCon.query(`select * from topic`, function(error, topics){
        if(error){
          throw error;
        }
        dbCon.query(`select * from topic where id=?`, [queryData.id], function(errorSec, topic){
          if(errorSec){
            throw errorSec;
          }
          dbCon.query(`select * from author`, function(errorSec, authors){
          var list = template.list(topics);
          var html = template.HTML(topic[0].title, list,
            `
            <form action="/update_process" method = "post">
              <input type = "hidden" name = "id" value = "${topic[0].id}"
              <p><input type = "text" name = "title" placeholder="title" value = "${topic[0].title}"></p>
              <p><textarea name = "description" placeholder="description">${topic[0].description}</textarea></p>
              <p>${template.authorSelect(authors, topic[0].author_id)}</p>
              <p><input type = "submit"></p>
            </form>
            `,
            `<a href="/create">create</a> <a href="/update?id=${topic[0].id}">update</a>`);
          response.writeHead(200);
          response.end(html);
          })
        })
      })
}

exports.update_process = function(request, response){
    var body = '';
    request.on('data', function (data) {
      body += data;
    });
    request.on('end', function () {
      var post = qs.parse(body);
      console.log(post);
      dbCon.query('UPDATE topic SET title=?, description=?, author_id=? WHERE id=?', [post.title, post.description, post.author, post.id], function(error, result){
        response.writeHead(302, {Location: `/?id=${post.id}`});
        response.end();
      })
    });
}

exports.delete_process = function(request, response){
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
}