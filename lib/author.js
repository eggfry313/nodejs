var template = require('./template')
var dbCon = require('./dbCon');

exports.home = function (request, response) {
    dbCon.query(`select * from topic`, function (error, topics) {
        dbCon.query(`select * from author`, function (error, authors) {
            var title = 'Welcome';
            var list = template.list(topics);
            var html = template.HTML(title, list,
                `
                ${template.authorList(authors)}
                <style>
                    table{
                        border-collapse:collapse;
                    }
                    td{
                        border:1px solid black;
                    }
                </style>
                `,
                `<a href="/create">create</a>`);
            response.writeHead(200);
            response.end(html);
        })
    })
}