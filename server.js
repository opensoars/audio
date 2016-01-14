var app = require('express')();

app.use(express.static(__dirname + '/public'));

app.listen(3333);