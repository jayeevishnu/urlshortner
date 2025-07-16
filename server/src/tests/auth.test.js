const request = require('supertest');
const app = require('../index');
const User = require('../models/User');

describe('Authentication Endpoints', () => {
  describe('POST /api/auth/register', () => {
    const validUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123',
    };

    it('should register a new user with valid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      expect(res.body).toHaveProperty('message', 'User registered successfully');
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user.email).toBe(validUser.email);
      expect(res.body.user.username).toBe(validUser.username);
    });

    it('should not register user with invalid email', async () => {
      const invalidUser = { ...validUser, email: 'invalid-email' };
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(res.body).toHaveProperty('error', 'Validation failed');
    });

    it('should not register user with weak password', async () => {
      const weakPasswordUser = { ...validUser, password: '123' };
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordUser)
        .expect(400);

      expect(res.body).toHaveProperty('error', 'Validation failed');
    });

    it('should not register user with existing email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      // Attempt to register with same email
      const duplicateUser = { ...validUser, username: 'different' };
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(duplicateUser)
        .expect(400);

      expect(res.body).toHaveProperty('error', 'User already exists with this email or username');
    });

    it('should not register user with existing username', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      // Attempt to register with same username
      const duplicateUser = { ...validUser, email: 'different@example.com' };
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(duplicateUser)
        .expect(400);

      expect(res.body).toHaveProperty('error', 'User already exists with this email or username');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
      });
      await user.save();
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(res.body).toHaveProperty('message', 'Login successful');
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should not login with invalid email', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: 'Password123',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(res.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should not login with invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(res.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should not login with malformed email', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'Password123',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(res.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('GET /api/auth/profile', () => {
    let token;
    let user;

    beforeEach(async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      token = res.body.token;
      user = res.body.user;
    });

    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(user.email);
      expect(res.body.user.username).toBe(user.username);
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should not get profile without token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(res.body).toHaveProperty('error', 'Access denied. No token provided.');
    });

    it('should not get profile with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(res.body).toHaveProperty('error', 'Invalid token.');
    });
  });
}); 