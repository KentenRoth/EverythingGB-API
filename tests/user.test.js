const request = require('supertest');
const app = require('../server/app');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../server/Models/User');

describe('POST /users', () => {
	beforeAll(async () => {
		User.deleteMany();
	});

	it('should create a new user', async () => {
		const newUser = {
			name: 'test',
			email: 'test@test.com',
			password: 'test1234',
		};
		const response = await request(app)
			.post('/users')
			.send(newUser)
			.expect(201);
	});

	it('should not create a new user with invalid email', async () => {
		const newUser = {
			name: 'test',
			email: 'test@',
			password: 'test1234',
		};
		const response = await request(app)
			.post('/users')
			.send(newUser)
			.expect(400);
	});

	it('should not create a new user with invalid password', async () => {
		const newUser = {
			name: 'test',
			email: 'test@test.com',
			password: 'test',
		};
		const response = await request(app)
			.post('/users')
			.send(newUser)
			.expect(400);
	});

	it('should login user', async () => {
		const response = await request(app)
			.post('/users/login')
			.send({
				email: 'test@test.com',
				password: 'test1234',
			})
			.expect(200);
	});

	it('should not login user with invalid email', async () => {
		const response = await request(app)
			.post('/users/login')
			.send({
				email: 'testing@test.com',
				password: 'test1234',
			})
			.expect(400);
	});

	it('should not login user with invalid password', async () => {
		const response = await request(app)
			.post('/users/login')
			.send({
				email: 'test@test.com',
				password: 'test12345',
			})
			.expect(400);
	});

	it('should logout the user', async () => {
		const newUser = {
			name: 'test3',
			email: 'test3@test.com',
			password: 'test1234',
		};
		const response = await request(app)
			.post('/users')
			.send(newUser)
			.expect(201);
		const token = response.body.token;
		await request(app)
			.post('/users/logout')
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		const user = await User.findOne({ email: 'test3@test.com' });
		expect(user.tokens.length).toEqual(0);
	});

	it('should not logout the user with bad auth token', async () => {
		const response = await request(app)
			.post('/users/login')
			.send({ email: 'test@test.com', password: 'test1234' })
			.expect(200);
		await request(app)
			.post('/users/logout')
			.set('Authorization', `Bearer ${response.body.authToken}1`)
			.expect(401);
	});

	it('should logout the user from all devices', async () => {
		const response = await request(app)
			.post('/users/login')
			.send({
				email: 'test@test.com',
				password: 'test1234',
			})
			.expect(200);
		await request(app)
			.post('/users/logoutAll')
			.set('Authorization', `Bearer ${response.body.authToken}`)
			.expect(200);
		const user = await User.findOne({ email: 'test@test.com' });
		expect(user.tokens.length).toEqual(0);
	});

	it('should not logout the user from all devices with bad auth token', async () => {
		const response = await request(app)
			.post('/users/login')
			.send({ email: 'test@test.com', password: 'test1234' })
			.expect(200);
		await request(app)
			.post('/users/logoutAll')
			.set('Authorization', `Bearer ${response.body.authToken}1`)
			.expect(401);
	});

	afterAll(async () => {
		await User.deleteMany();
	});
});

describe('GET /users', () => {
	beforeAll(async () => {
		const testUser1 = {
			name: 'test',
			email: 'test@test.com',
			password: 'test1234',
		};
		const testUser2 = {
			name: 'test2',
			email: 'test2@test.com',
			password: 'test1234',
			role: 'admin',
		};
		await request(app).post('/users').send(testUser1);
		await request(app).post('/users').send(testUser2);
	});

	it('should get all users', async () => {
		const response = await request(app).get('/users').expect(200);
		expect(response.body.length).toEqual(2);
	});

	it('should have a name of test, email of test@test.com, and role of user', async () => {
		const response = await request(app).get('/users').expect(200);
		expect(response.body[0].name).toEqual('test');
		expect(response.body[0].email).toEqual('test@test.com');
		expect(response.body[0].role).toEqual('user');
	});

	it('should have a name of test2, email of test2@test.com, and role of admin', async () => {
		const response = await request(app).get('/users').expect(200);
		expect(response.body[1].name).toEqual('test2');
		expect(response.body[1].email).toEqual('test2@test.com');
		expect(response.body[1].role).toEqual('admin');
	});

	it('should not have a password of test1234', async () => {
		const response = await request(app).get('/users').expect(200);
		expect(response.body[0].password).not.toEqual('test1234');
		expect(response.body[1].password).not.toEqual('test1234');
	});

	it('should get user by id', async () => {
		const response = await request(app).get('/users').expect(200);
		const id = response.body[0]._id;
		const user = await request(app).get(`/users/${id}`).expect(200);
		expect(user.body.name).toEqual('test');
		expect(user.body.email).toEqual('test@test.com');
	});

	it('should not get user with invalid id', async () => {
		const response = await request(app).get('/users').expect(200);
		const id = response.body[0]._id;
		const user = await request(app).get(`/users/${id}1`).expect(500);
	});

	it('should get user that is logged in', async () => {
		const newUser = {
			name: 'test3',
			email: 'test3@test.com',
			password: 'test1234',
		};
		const response = await request(app)
			.post('/users')
			.send(newUser)
			.expect(201);
		const token = response.body.token;
		const user = await request(app)
			.get('/users/me')
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(user.body.name).toEqual('test3');
		expect(user.body.email).toEqual('test3@test.com');
	});

	it('should not get user that is not logged in with bad auth token', async () => {
		const newUser = {
			name: 'test4',
			email: 'test4@test.com',
			password: 'test1234',
		};
		const response = await request(app)
			.post('/users')
			.send(newUser)
			.expect(201);
		const token = response.body.token;
		const user = await request(app)
			.get('/users/me')
			.set('Authorization', `Bearer ${token}1`)
			.expect(401);
	});

	afterAll(async () => {
		await User.deleteMany();
	});
});

describe('PATCH /users', () => {
	beforeAll(async () => {
		const newUser = {
			name: 'test',
			email: 'test@test.com',
			password: 'test1234',
		};
		const response = await request(app)
			.post('/users')
			.send(newUser)
			.expect(201);
	});

	it('should update users name', async () => {
		const response = await request(app)
			.post('/users/login')
			.send({ email: 'test@test.com', password: 'test1234' })
			.expect(200);
		const token = response.body.authToken;
		await request(app)
			.patch('/users/me')
			.set('Authorization', `Bearer ${token}`)
			.send({ name: 'test1' })
			.expect(200);
		const user = await User.findOne({ email: 'test@test.com' });
		expect(user.name).toEqual('test1');
	});

	it('should update users email', async () => {
		const response = await request(app)
			.post('/users/login')
			.send({ email: 'test@test.com', password: 'test1234' })
			.expect(200);
		const token = response.body.authToken;
		await request(app)
			.patch('/users/me')
			.set('Authorization', `Bearer ${token}`)
			.send({ email: 'test1@test.com' })
			.expect(200);
		const user = await User.findOne({ email: 'test1@test.com' });
		expect(user.email).toEqual('test1@test.com');
	});

	it('should update users password', async () => {
		const response = await request(app)
			.post('/users/login')
			.send({ email: 'test1@test.com', password: 'test1234' })
			.expect(200);
		const token = response.body.authToken;
		await request(app)
			.patch('/users/me')
			.set('Authorization', `Bearer ${token}`)
			.send({ password: 'test4321' })
			.expect(200);
		await request(app)
			.post('/users/login')
			.send({ email: 'test1@test.com', password: 'test4321' })
			.expect(200);
	});

	it('should update users bookmarks', async () => {
		const response = await request(app)
			.post('/users/login')
			.send({ email: 'test1@test.com', password: 'test4321' })
			.expect(200);
		const token = response.body.authToken;
		await request(app)
			.patch('/users/me')
			.set('Authorization', `Bearer ${token}`)
			.send({ bookmarks: ['5f1c9a2a1c9d440000b7d8f1'] })
			.expect(200);
		const user = await User.findOne({ email: 'test1@test.com' });
		expect(user.bookmarks.length).toEqual(1);
	});

	it('should not update role', async () => {
		const response = await request(app)
			.post('/users/login')
			.send({ email: 'test1@test.com', password: 'test4321' })
			.expect(200);
		const token = response.body.authToken;
		await request(app)
			.patch('/users/me')
			.set('Authorization', `Bearer ${token}`)
			.send({ role: 'admin' })
			.expect(400);
	});

	it('should not update with invalid token', async () => {
		const response = await request(app)
			.post('/users/login')
			.send({ email: 'test1@test.com', password: 'test4321' })
			.expect(200);
		const token = response.body.authToken;
		await request(app)
			.patch('/users/me')
			.set('Authorization', `Bearer ${token}1`)
			.send({ name: 'test2' })
			.expect(401);
	});

	afterAll(async () => {
		await User.deleteMany();
	});
});
