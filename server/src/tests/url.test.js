const request = require('supertest');
const app = require('../index');
const User = require('../models/User');
const Url = require('../models/Url');

describe('URL Endpoints', () => {
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

  describe('POST /api/urls/shorten', () => {
    const validUrl = {
      originalUrl: 'https://www.example.com',
    };

    it('should shorten a valid URL without authentication', async () => {
      const res = await request(app)
        .post('/api/urls/shorten')
        .send(validUrl)
        .expect(201);

      expect(res.body).toHaveProperty('message', 'URL shortened successfully');
      expect(res.body).toHaveProperty('url');
      expect(res.body).toHaveProperty('shortUrl');
      expect(res.body.url.originalUrl).toBe(validUrl.originalUrl);
      expect(res.body.url.shortCode).toBeDefined();
      expect(res.body.url.user).toBeNull();
    });

    it('should shorten a valid URL with authentication', async () => {
      const res = await request(app)
        .post('/api/urls/shorten')
        .set('Authorization', `Bearer ${token}`)
        .send(validUrl)
        .expect(201);

      expect(res.body).toHaveProperty('message', 'URL shortened successfully');
      expect(res.body).toHaveProperty('url');
      expect(res.body).toHaveProperty('shortUrl');
      expect(res.body.url.originalUrl).toBe(validUrl.originalUrl);
      expect(res.body.url.user).toBe(user._id);
    });

    it('should not shorten invalid URL', async () => {
      const invalidUrl = {
        originalUrl: 'not-a-valid-url',
      };

      const res = await request(app)
        .post('/api/urls/shorten')
        .send(invalidUrl)
        .expect(400);

      expect(res.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('GET /:code (redirect)', () => {
    let shortCode;

    beforeEach(async () => {
      // Create a test URL
      const url = new Url({
        originalUrl: 'https://www.example.com',
        shortCode: 'testcode',
        user: user._id,
      });
      await url.save();
      shortCode = url.shortCode;
    });

    it('should redirect to original URL and track click', async () => {
      const res = await request(app)
        .get(`/${shortCode}`)
        .expect(302);

      expect(res.headers.location).toBe('https://www.example.com');

      // Check if click was tracked
      const url = await Url.findOne({ shortCode });
      expect(url.totalClicks).toBe(1);
      expect(url.clicks.length).toBe(1);
    });

    it('should return 404 for non-existent short code', async () => {
      const res = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(res.body).toHaveProperty('error', 'URL not found');
    });
  });
}); 