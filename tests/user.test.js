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
		const newUser = {
			name: 'test',
			email: 'test@test.com',
			password: 'test1234',
		};
		await request(app).post('/users').send(newUser);
	});

	it('should get all users', async () => {
		const response = await request(app).get('/users').expect(200);
		expect(response.body.length).toEqual(1);
	});

	it('should have a name of test and email of test@test.com', async () => {
		const response = await request(app).get('/users').expect(200);
		expect(response.body[0].name).toEqual('test');
		expect(response.body[0].email).toEqual('test@test.com');
	});

	it('should not have a password of test1234', async () => {
		const response = await request(app).get('/users').expect(200);
		expect(response.body[0].password).not.toEqual('test1234');
	});

	afterAll(async () => {
		await User.deleteMany();
	});
});
