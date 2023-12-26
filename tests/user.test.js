const request = require('supertest');
const app = require('../server/app');
const User = require('../server/Models/User');

describe('POST /users', () => {
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

	afterAll(async () => {
		await User.deleteMany();
	});
});
