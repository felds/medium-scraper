#!/usr/bin/env node

const colors = require('colors')
const fetch = require('node-fetch')
const { URLSearchParams } = require('url')
const fs = require('fs')
const path = require('path')

const publication = 'trend-r'


const opts = {
    headers: {
        'Accept': 'application/json',
    },
    timeout: 5000, // ms
}

async function scrape(to) {
    const limit = 10

    const query = new URLSearchParams({
        sortBy: 'latest',
        limit,
        to: to || Date.now(),
    })

    const list = await fetch(`https://medium.com/${publication}/load-more?${query}`, opts)
        .then(r => r.text())
        .then(s => s.slice(16))
        .then(j => JSON.parse(j))
        .catch(err => console.log(err))

    const downloaded = Promise.all(list.payload.value.map(post =>
        fetch(buildMediumURL(post, list.payload), opts)
            .then(r => savePost(r, post))
    ))

    try {
        scrape(list.payload.paging.next.to)
    } catch (err) {
        console.log("Finished!".blue)
    }
}
scrape()




function qs(obj) {
    return Object.keys(obj).map(k => `${k}`)
}
function buildMediumURL(post, payload) {
    const collectionId = post.homeCollectionId
    const domain = payload.references.Collection[collectionId].domain
    const slug = post.uniqueSlug
    
    return `https://${domain}/${slug}`
}
function savePost(response, post) {
    return new Promise((win, fail) => {
        const filename = `out/${post.uniqueSlug}.html`
        const f = fs.createWriteStream(filename)
        f.on('finish', _ => {
            console.log(`😀 Successfully downloaded ${post.title}`.green)
            win()
        })
        f.on('error', _ => {
            console.log(`😫 Error downloading ${post.title}`.red)
            fail()
        })
        response.body.pipe(f)
    })
}