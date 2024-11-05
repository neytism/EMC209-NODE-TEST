const client = require('./connection');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());

app.listen(3000, ()=> {
    console.log("Server is now listenting at post 3000");
});

client.connect();

app.get('/users', (req, res) => {
    client.query('SELECT * FROM users', (err, result)=> {
        if(!err){
            res.send(result.rows)
        }
    });

    client.end;
});