const _ = require('lodash')

const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    return blogs.reduce(
        (accumulator, currentValue) => accumulator + currentValue.likes, 0)
}

const favoriteBlog = (blogs) => {

    if (blogs.length === 0) {
        return null
    } else {
        const {title, author, likes} = blogs.reduce((prev, current) => {
            if (current.likes > prev.likes) {
                return current
            } else {
                return prev
            }
        })

        return {title, author, likes}
    }
}

const mostBlogs = (blogs) => {
    return _(blogs)
        .groupBy('author')
        .map((blogArr, author) => ({
            author: author,
            blogs: blogArr.length
        }))
        .maxBy('blogs')
}

const mostLikes = (blogs) => {
    return _(blogs)
        .groupBy('author')
        .map((blogArr, author) => ({
            author: author,
            likes: _.sumBy(blogArr, 'likes')
        }))
        .maxBy('likes')
}

module.exports = {
    dummy, totalLikes, favoriteBlog, mostBlogs, mostLikes
}