const request = require('supertest');
const app = require('../server/app');
const User = require('../server/Models/User');

describe('POST /users', () => {
	beforeEach(async () => {
		await User.deleteMany();
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
});

describe('GET /users', () => {
	it('should get all users', async () => {
		const response = await request(app).get('/users').expect(200);
	});
});
