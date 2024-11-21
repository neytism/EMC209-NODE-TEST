const client = require('./connection');
const express = require('express');
const jwt = require('jsonwebtoken')
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());

app.listen(3000, ()=> {
    console.log("Server is now listenting at post 3000");
});

client.connect();

const JWT_SECRET = 'this-is-a-secret-token';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(!token){
        return res.status(401).send('Access token required');        
    }

    jwt.verify(token, JWT_SECRET, (err, user)=>{
        if(err){
            return res.send('expired_token');
            //return res.status(403).send('Invalid or expired token');
        } else {
            req.user = user;
            next();
        }
    });
}

app.get('/users', authenticateToken, (req, res)=>{
    client.query('Select * from users', (err,result)=>{
        if(!err){
            res.send(result.rows);
        } 
    });
    client.end;
})

app.get('/users/current', authenticateToken, (req, res) => {
    const id = req.user.userId;
    
    client.query(`SELECT * FROM users WHERE id = '${id}'`, (err, result) => {
        if (err) {
            console.log(err.message);
            return res.status(500).send('Internal Server Error');
        }

        if (result.rows.length > 0) {
            res.send(result.rows[0]);
        } else {
            res.status(404).send('User not found');
        }
    });
    
    client.end;
});

//select row
app.get('/users/:username',authenticateToken, (req, res) => {
    
    client.query(`SELECT * FROM users WHERE username = '${req.params.username}'`, (err, result)=> {
        if(!err){
            if (result.rows.length > 0) {
                res.send(result.rows[0]);
            } else {
                res.send("no_user");
            }
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
// app.delete('/users/:id', (req, res) => {
//     let deleteQuery = `DELETE FROM users WHERE id = '${req.params.id}'`;
//     client.query(deleteQuery, (err, result)=> {
//         if(!err){
//             res.send(`User with id of ${req.params.id} deleted successfully!`)
//         } else{
//             console.log(err.message);
//         }
//     });
    
//     client.end;
// });




//login
app.post('/users/login', (req, res) => {

    try{
        
        const user = req.body;

        if(!user.password || !user.username){
            return res.send('Missing fields');
        }
        
        let findQuery = `SELECT * FROM users WHERE username = '${user.username}' AND password = '${user.password}'`;
        
        client.query(findQuery , (err, result)=> {
            if(!err) {

                if(result.rows <= 0){
                    res.send('no_users');
                } else {
                    const user = result.rows[0];
                    const token = jwt.sign( {userId: user.id ,username: user.username, email: user.email}, JWT_SECRET, {expiresIn: '24h'});
                    res.json({token});
                }
            } else{
                console.log(err.message);
            }
            
        });
        
        client.end;
    
    }catch (error){
        console.error('Login Error', error);
     }

    

});


app.get('/users/checkUsername/:username', (req, res) => {
    client.query(`SELECT * FROM users WHERE username = '${req.params.username}'`, (err, result)=> {
        if(!err){
            if (result.rows.length > 0) {
                res.send("username_taken");
            } else {
                res.send("username_available"); 
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
                res.send("email_taken");
            } else {
                res.send("email_available"); 
            }
        } else {
            console.log(err.message);
        }
    });
    
    client.end;
});


//register
app.post('/users/register', (req, res) => {

    try {

        const user = req.body;
        if (!user.password || !user.username || !user.email) {
            return res.send('Missing fields');
        }

        let insertQuery = `INSERT INTO users(username, password, email) VALUES('${user.username}','${user.password}','${user.email}')`;


        client.query(insertQuery, (err, result) => {
            if (!err) {

                let findQuery = `SELECT * FROM users WHERE username = '${user.username}'`;
                
                client.query(findQuery, (err, result) => {
                    if (!err) {
                        if (result.rows <= 0) {
                            res.send('no_users');
                        } else {
                            const user = result.rows[0];
                            const token = jwt.sign({ userId: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
                            res.json({ token });
                        }
                    } else {
                        console.log(err.message);
                    }

                });
            } else {
                console.log(err.message);
            }

        });

        client.end;

    } catch (error) {
        console.error('Login Error', error);
    }

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



app.get('/leaderboard',authenticateToken, (req, res) => {

    const topPlayersQuery = `SELECT id, username, email, kills, deaths, 
                            CASE 
                                WHEN deaths = 0 THEN CAST(kills AS DECIMAL(10, 1)) 
                                ELSE ROUND(CAST(kills AS DECIMAL(10, 1)) / CAST(deaths AS DECIMAL(10, 1)), 1)
                            END AS ratio 
                            FROM users 
                            ORDER BY 
                                CASE WHEN deaths = 0 
                                    THEN 0 
                                    ELSE 1 
                                END, ratio DESC 
                            LIMIT 10;`;
    
    client.query(topPlayersQuery, (err, result)=> {
        if(!err){
            if (result.rows.length > 0) {
                res.send(result.rows);
            } else {
                res.send("no_user");
            }
        } 
    });
    
    client.end;
});

app.delete('/users', authenticateToken, (req, res) => {

    const id = req.user.userId;

    let deleteQuery = `DELETE FROM users WHERE id = '${id}'`;
    client.query(deleteQuery, (err, result)=> {
        if(!err){
            res.send(`User with id of ${id} deleted successfully!`)
        } else{
            console.log(err.message);
        }
    });
    
    client.end;
});
