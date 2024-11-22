const client = require('./connection');
const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.listen(3000, () => {
    console.log("Server is now listening at port 3000");
});

client.connect();
const JWT_SECRET = 'this-is-a-secret-token';

//token authentication
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).send('Access token required');
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).send('Invalid or expired token');
        } else {
            req.user = user;
            next();
        }
    });
};

//get all users
app.get('/users', authenticateToken, async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM users');
        res.send(result.rows);
    } catch (error) {
        console.error('Get all users Error', error);
        res.status(500).send('Internal Server Error');
    }
});

//get current user
app.get('/users/me', authenticateToken, (req, res) => {
    try {

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

    } catch (error) {
        console.error('Get user by ID Error', error);
        res.status(500).send('Internal Server Error');
    }

});

//get user by username
app.get('/users/:username', authenticateToken, (req, res) => {
    try {

        client.query(`SELECT * FROM users WHERE username = '${req.params.username}'`, (err, result) => {
            if (!err) {
                if (result.rows.length > 0) {
                    res.send(result.rows[0]);
                } else {
                    res.send("no_user");
                }
            }
        });

        client.end;

    } catch (error) {
        console.error('Get user by username Error', error);
        res.status(500).send('Internal Server Error');
    }
});

//login
app.post('/auth/login', (req, res) => {
    try {
        const user = req.body;

        if (!user.password || !user.username) {
            return res.send('Missing fields');
        }

        let loginQuery = `SELECT * FROM users WHERE username = '${user.username}' AND password = '${user.password}'`;

        client.query(loginQuery, (err, result) => {
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

        client.end;

    } catch (error) {
        console.error('Login Error', error);
        res.status(500).send('Internal Server Error');
    }
});

//register
app.post('/users', async (req, res) => {
    try {

        const user = req.body;
        if (!user.password || !user.username || !user.email) {
            return res.send('Missing fields');
        }

        let checkExistingUsernameQuery = `SELECT * FROM users WHERE username = '${user.username}'`;

        const checkUsernameResult = await client.query(checkExistingUsernameQuery);

        if (checkUsernameResult.rows.length > 0) {
            return res.status(405).send('Username already taken.');
        }

        let checkExistingEmailQuery = `SELECT * FROM users WHERE email = '${user.email}'`;

        const checkEmailResult = await client.query(checkExistingEmailQuery);

        if (checkEmailResult.rows.length > 0) {
            return res.status(406).send('Email already taken.');
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
        console.error('Register Error', error);
    }
});

app.get('/leaderboard', authenticateToken, (req, res) => {
    try {

        const topPlayersQuery = `SELECT id, username, email, kills, deaths, 
        CASE 
            WHEN deaths = 0 AND kills > 0 THEN CAST(kills AS DECIMAL(10, 1))
            WHEN deaths = 0 THEN 0.0
            ELSE ROUND(CAST(kills AS DECIMAL(10, 1)) / CAST(deaths AS DECIMAL(10, 1)), 1)
        END AS ratio 
        FROM users 
        ORDER BY 
            CASE 
                WHEN deaths = 0 AND kills = 0 THEN 2 
                WHEN deaths = 0 THEN 0
                ELSE 1 
            END, ratio DESC 
        LIMIT 10;`;

        client.query(topPlayersQuery, (err, result) => {
            if (!err) {
                if (result.rows.length > 0) {
                    res.send(result.rows);
                } else {
                    res.send("no_user");
                }
            }
        });

        client.end;

    } catch (error) {
        console.error('Leaderboard Error', error);
        res.status(500).send('Server error retrieving leaderboard');
    }
});

app.delete('/users', authenticateToken, (req, res) => {
    try {
        const id = req.user.userId;

        let deleteQuery = `DELETE FROM users WHERE id = '${id}'`;
        client.query(deleteQuery, (err, result) => {
            if (!err) {
                res.send(`User with id of ${id} deleted successfully!`)
            } else {
                console.log(err.message);
            }
        });

        client.end;

    } catch (error) {
        console.error('Delete User Error', error);
        res.status(500).send('Server error deleting user');
    }
});

app.put('/combat/kills', (req, res) => {
    try {
        const user = req.body;
        
        let increaseQuery = `UPDATE users SET kills = kills + '${user.increase}' WHERE id = '${user.id}'`;
        client.query(increaseQuery, (err, result) => {
            if (err) {
                console.log(err.message);
            }
        });
        
        client.end;
    
    } catch (error) {
        console.error('Update Kill Count Error', error);
        res.status(500).send('Server error updating kill count');
    }
});

app.put('/combat/deaths', (req, res) => {
    try {
        const user = req.body;        
        let increaseQuery = `UPDATE users SET deaths = deaths + '${user.increase}' WHERE id = '${user.id}'`;
        
        client.query(increaseQuery, (err, result) => {
            if (err) {
                console.log(err.message);
            }
        });
        
        client.end;
    
    } catch (error) {
        console.error('Update Death Count Error', error);
        res.status(500).send('Server error updating Death count');
    }
});
