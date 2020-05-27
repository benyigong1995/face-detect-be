const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'miracle',
    password : '',
    database : 'smart-brain'
  }
});

const app = express();

app.use(express.json());
app.use(cors());
const database = {
	users: [
		{
			id: '123',
			email: 'john@gmail.com',
			password: 'cookies',
			entries: 0,
			joined: new Date()
		},
		{
			id: '124',
			email: 'mary@gmail.com',
			password: 'mary',
			entries: 0,
			joined: new Date()
		}
	]
}

app.get('/', (req, res) => {
	res.send(database.users);
})

app.post('/signin', (req, res) => {
	db.select('email', 'hash').from('login')
	.where('email', '=', req.body.email)
	.then(data => {
		const isValid = bcrypt
		.compareSync(req.body.password, data[0].hash);
		console.log(isValid);
		if (isValid) {
			return db.select('*').from('users')
			.where('email', '=', req.body.email)
			.then(user => {
				console.log(user);
				res.json(user[0]);
			}).catch(err => res.status(400).json('unable to get'));
		} else {
			res.status(400).json('wrong pass');
		}
	}).catch(err => res.status(400).json('wrong pass'));
})

app.post('/signup', (req, res) => {
	const {email, password} = req.body;
	const hash = bcrypt.hashSync(password);
	db.transaction(trx => {
		trx.insert({
			hash: hash,
			email: email
		}).into('login')
		.returning('email')
		.then(loginEmail => {
			return trx('users')
				.returning('*')
				.insert({
					email: loginEmail[0],
					joined: new Date()
				})
				.then(user => {
					res.json(user[0]);
				});
		}).then(trx.commit)
		.catch(trx.rollback)
	}).catch(err => res.status(400).json('unable to join'));
})

app.get('/profile/:id', (req, res) => {
	const {id} = req.params;
	db.select('*').from('users')
	.where({
		id: id
	})
	.then(users => {
		if (users.length > 0) {
			res.json(users[0]);
		} else {
			res.status(400).json('Not Found');
		}
		
	}).catch(err => res.status(400).json(err));
})

app.put('/image', (req, res) => {
	const {id} = req.body;
	db('users').where('id', '=', id)
	.increment('entries', 1)
	.returning('entries')
	.then(entries => {
		res.json(entries[0]);
	}).catch(err => res.status(400).json(err));
})



app.listen(process.env.PORT || 3001, () => {
	console.log(`app is running on port 3001 ${process.env.PORT}`);
})




