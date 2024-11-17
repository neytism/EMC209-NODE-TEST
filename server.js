const client = require('./connection');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());

app.listen(3000, ()=> {
    console.log("Server is now listenting at post 3000");
});

client.connect();

//select rows
app.get('/users', (req, res) => {
    client.query('SELECT * FROM users', (err, result)=> {
        if(!err){
            res.send(result.rows)
        }
    });
    
    client.end;
});

//select row
app.get('/users/:username', (req, res) => {
    client.query(`SELECT * FROM users WHERE username = '${req.params.username}'`, (err, result)=> {
        if(!err){
            res.send(result.rows)
        } 
    });
    
    client.end;
});

//insert
app.post('/users', (req, res) => {
    const user = req.body;
    let insertQuery = `INSERT INTO users(username, password, email) VALUES('${user.username}','${user.password}','${user.email}')`;
    
    client.query(insertQuery , (err, result)=> {
        if(!err){
            res.send("Registration Successful!");
        } else{
            console.log(err.message);
        }
    });
    
    client.end;

});

//update
app.put('/users/:id', (req, res) => {
    const user = req.body;
    let updateQuery = `UPDATE users SET username = '${user.username}', email = '${user.email}', password = '${user.password}' WHERE id = '${req.params.id}'`;
    
    client.query(updateQuery , (err, result)=> {
        if(!err){
            res.send("Password changed successfully!");
        } else{
            console.log(err.message);
        }
    });
    
    client.end;

});

//delete
app.delete('/users/:id', (req, res) => {
    let deleteQuery = `DELETE FROM users WHERE id = '${req.params.id}'`;
    client.query(deleteQuery, (err, result)=> {
        if(!err){
            res.send(`User with id of ${req.params.id} deleted successfully!`)
        } else{
            console.log(err.message);
        }
    });
    
    client.end;
});

//login
app.post('/users/login', (req, res) => {
    const user = req.body;
    
    let findQuery = `SELECT * FROM users WHERE username = '${user.username}' AND password = '${user.password}'`;
    
    client.query(findQuery , (err, result)=> {
        if(!err){
            res.send(result.rows);
        } else{
            console.log(err.message);
        }
    });
    
    client.end;

});


app.get('/users/checkUsername/:username', (req, res) => {
    client.query(`SELECT * FROM users WHERE username = '${req.params.username}'`, (err, result)=> {
        if(!err){
            if (result.rows.length > 0) {
                res.send("true");
            } else {
                res.send("false"); 
            }
        } else {
            console.log(err.message);
        }
    });
    
    client.end;
});


app.get('/users/checkEmail/:email', (req, res) => {
    client.query(`SELECT * FROM users WHERE email = '${req.params.email}'`, (err, result)=> {
        if(!err){
            if (result.rows.length > 0) {
                res.send("true");
            } else {
                res.send("false"); 
            }
        } else {
            console.log(err.message);
        }
    });
    
    client.end;
});


//register
app.post('/users/register', (req, res) => {
    const user = req.body;
    let insertQuery = `INSERT INTO users(username, password, email) VALUES('${user.username}','${user.password}','${user.email}')`;
    
    client.query(insertQuery , (err, result)=> {
        if(!err){
            res.send("Registration Successful!");
        } else{
            console.log(err.message);
        }
    });
    
    client.end;

});

//update password
app.post('/users/updatePassword', (req, res) => {
    const user = req.body;
    let updateQuery = `UPDATE users SET password = '${user.password}' WHERE id = '${user.id}'`;
    
    client.query(updateQuery , (err, result)=> {
        if(!err){
            res.send("Update Successful!");
        } else{
            console.log(err.message);
        }
    });
    
    client.end;

});