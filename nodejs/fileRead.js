var fs = require('fs');
fs.readFile('meaninglessText.txt', 'utf-8', function(err, data){
    console.log(data);
});