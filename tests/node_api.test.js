const supertest = require('supertest')
const mongoose = require('mongoose')
const helper = require('./test_helper')
const bcrypt = require('bcrypt')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')
const User = require('../models/user')

beforeEach(async () => {
    await Blog.deleteMany({})

    const blogObjects = helper.initialBlogs
        .map(blog => new Blog(blog))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
})

test('blogs are returned as json', async () => {
    await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
})

test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(helper.initialBlogs.length)
})

test('identifier of blog posts is \'id\'', async () => {
    const response = await api.get('/api/blogs')
    const ids = response.body.map(r => r.id)

    ids.forEach(id => expect(id).toBeDefined)
})

test('a specific blog is within the returned blogs', async () => {
    const response = await api.get('/api/blogs')

    const authors = response.body.map(r => r.author)
    expect(authors).toContain('Michael Chan')
})

describe('adding blogs', () => {
    beforeEach(async () => {
        await User.deleteMany({})

        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({username: 'root', passwordHash})

        await user.save()
    })

    test('a valid blog can be added', async () => {
        const newBlog = {
            title: 'newTitle',
            author: 'newAuthor',
            url: 'newUrl.com',
            likes: 999,
        }

        const loginUser = {
            username: 'root',
            password: 'sekret'
        }

        const loginResult = await api
            .post('/api/login')
            .send(loginUser)

        const token = loginResult.body.token

        await api
            .post('/api/blogs')
            .set('Authorization', `Bearer ${token}`)
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

        const authors = blogsAtEnd.map(n => n.author)
        expect(authors).toContain('newAuthor')
    })

    test('likes defaults to 0 if not provided', async () => {
        const newBlog = {
            title: 'newTitle',
            author: 'newAuthor',
            url: 'newUrl.com',
        }

        const loginUser = {
            username: 'root',
            password: 'sekret'
        }

        const loginResult = await api
            .post('/api/login')
            .send(loginUser)

        const token = loginResult.body.token

        const resultBlog = await api
            .post('/api/blogs')
            .set('Authorization', `Bearer ${token}`)
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        expect(resultBlog.body.likes).toBe(0)
        expect(resultBlog.body.author).toBe('newAuthor')
    })
    test('adding a blog fails with the proper status code 401 Unauthorized if a token is not provided', async () => {
        const blogsAtStart = await helper.blogsInDb()

        const newBlog = {
            title: 'newTitle',
            author: 'newAuthor',
            url: 'newUrl.com',
        }

        const result = await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(401)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('invalid token')

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(blogsAtStart.length)
    })
    test('missing blog title in request returns status code 400', async () => {
        const newBlog = {
            author: 'newAuthor',
            url: 'newUrl.com',
            likes: 5
        }

        const loginUser = {
            username: 'root',
            password: 'sekret'
        }

        const loginResult = await api
            .post('/api/login')
            .send(loginUser)

        const token = loginResult.body.token

        await api
            .post('/api/blogs')
            .set('Authorization', `Bearer ${token}`)
            .send(newBlog)
            .expect(400)
    })

    test('missing blog url in request returns status code 400', async () => {
        const newBlog = {
            title: 'newTitle',
            author: 'newAuthor',
            likes: 5
        }

        const loginUser = {
            username: 'root',
            password: 'sekret'
        }

        const loginResult = await api
            .post('/api/login')
            .send(loginUser)

        const token = loginResult.body.token

        await api
            .post('/api/blogs')
            .set('Authorization', `Bearer ${token}`)
            .send(newBlog)
            .expect(400)
    })

})

afterAll(() => {
    mongoose.connection.close()
})