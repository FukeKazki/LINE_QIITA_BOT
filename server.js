import express from 'express';
import * as line from '@line/bot-sdk';
import crypto from 'crypto';
import axios from 'axios';
import { config }  from './setting';

const app = express();
const client = new line.Client(config);
const PORT = process.env.PORT || 3000;

app.post('/webhook', line.middleware(config), (req, res) => {
    if (!validate_signature(req.headers['x-line-signature'], req.body)) return;
    const replyToken = req.body.events[0].replyToken;
    const messageText = req.body.events[0].message.text;

    searchQiitaArticle(messageText).then((data) => {
        replyText(replyToken, data);
    }).catch((e) => {
        console.log('REJECT_ERROR' + e);
        replyText(replyToken, 'エラーが発生しました.');
    });

});
app.get('/', (req, res) => {
    res.json({text: 'Hello World!'});
});
app.listen(PORT);
console.log(`Server running at ${PORT}`);


/**
 * 署名の検証
 * @param signature
 * @param body
 * @returns {boolean}
 */
const validate_signature = (signature, body) => {
    return signature === crypto.createHmac('SHA256', config.channelSecret).update(JSON.stringify(body)).digest('base64');
};

const searchQiitaArticle = async(tag) => {
    const url = `http://qiita.com/api/v2/items?page=1&per_page=5&query=tag:${encodeURIComponent(tag)}`;
    try {
       const articles = await axios.get(url);
       let titles = '';
       for(const item of articles.data) {
          titles += item.title + '\n' + item.url + '\n\n';
       }
       return Promise.resolve(titles);
    } catch (e) {
       console.log('rejectします');
       return Promise.reject(e);
    }
};

/**
 * 返信する
 * @param replyToken
 * @param text
 */
const replyText = (replyToken, text = 'DEFAULT_TEXT') => {
    client.replyMessage(replyToken, {type: 'text', text: text});
};