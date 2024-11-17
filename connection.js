//install node js
//install postgres
//install pgAdmin 4
//restart
//npm install pg --save
//node server.js
//install postman for post

const {Client} = require('pg');

const client = new Client({
    host: "localhost",
    user: "postgres",
    post: 5432,
    password: "postgress", //accidentaly added an extra s on my pc
    database: "gamenetworking"
});

module.exports = client;