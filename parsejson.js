const [ from, to ] = process.argv.slice(2)
const fs = require('fs')

if (from && to) {
    const f = fs.createWriteStream(to)
    fs.readFile(from, (err, data) => {
        obj = JSON.parse(data.toString().slice(16))
        f.write(JSON.stringify(obj, null, 4))
    })
}
