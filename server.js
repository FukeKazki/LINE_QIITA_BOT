import express from 'express'
import * as line from '@line/bot-sdk'
import crypto from 'crypto'
import axios from 'axios'
// import {
//     config
// } from './setting'

// heroku上の環境変数の取得
const ACCESS_TOKEN = process.env.ACCESS_TOKEN
const SECRET_KEY = process.env.SECRET_KEY
const config = {
    channelAccessToken: ACCESS_TOKEN,
    channelSecret: SECRET_KEY,
}
const app = express()
const client = new line.Client(config)
const PORT = process.env.PORT || 3000

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    next()
})

app.post('/webhook', line.middleware(config), async (req, res) => {
    res.status(200).end()
    if (!validate_signature(req.headers['x-line-signature'], req.body)) return
    const replyToken = req.body.events[0].replyToken
    const messageText = req.body.events[0].message.text
    const articles = await searchQiitaArticle(messageText).catch(e => 'NOT FOUND')
    replyText(replyToken, articles)
})
app.listen(PORT)
console.log(`Server running at ${PORT}`)

/**
 * 署名の検証
 * @param signature
 * @param body
 * @returns {boolean}
 */
const validate_signature = (signature, body) => {
    return signature === crypto.createHmac('SHA256', config.channelSecret).update(JSON.stringify(body)).digest('base64');
};

const searchQiitaArticle = async (tag) => {
    const url = `http://qiita.com/api/v2/items?page=1&per_page=5&query=tag:${encodeURIComponent(tag)}`
    const articles = await axios.get(url).catch(e => Promise.reject('Error'))
    return new Promise(async (resolve, reject) => {
        if (articles.data.length === 0) reject('NOT FOUND')
        let titles = ''
        for (const item of articles.data) {
            titles += item.title + '\n' + item.url + '\n\n';
        }
        resolve(titles)
    })
}
/**
 * 返信する
 * @param replyToken
 * @param text
 */
const replyText = (replyToken, text = 'DEFAULT_TEXT') => {
    client.replyMessage(replyToken, {
        type: 'text',
        text: text
    });
};