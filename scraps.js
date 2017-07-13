#!/usr/bin/env node

const colors = require('colors')
const fetch = require('node-fetch')
const { URL, URLSearchParams } = require('url')
const fs = require('fs')
const path = require('path')


const publication = 'trend-r'


const opts = {
    headers: {
        'Accept': 'application/json',
    },
    // timeout: 10000, // ms
}

async function scrape(to) {
    const limit = 20

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

    list.payload.value.forEach(post => {
        const url = buildMediumURL(post, list.payload)
        fetch(url, opts)
            .then(r => savePost(r, post))
            .then(_ => console.log(`💚 ${post.title}`.green))
            .catch(err => `💔 Error downloading ${post.title}
            url: ${url}
            ${err}
            `.red)
    })

    try {
        setTimeout(_ => scrape(list.payload.paging.next.to), 10000)
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
    
    const url = new URL(`https://${domain}`)
    url.pathname = slug
    
    return url.toString()
}
function savePost(response, post) {
    return new Promise((win, fail) => {
        const filename = `out/${post.uniqueSlug}.html`
        const f = fs.createWriteStream(filename)
        f.on('finish', _ => win())
        f.on('error', _ => {
            console.log(`😫 Error downloading ${post.title}`.red)
            fail()
        })

        response.body.pipe(f)
    })
}