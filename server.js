import express from 'express';
import * as line from '@line/bot-sdk';
import crypto from 'crypto';
import axios from 'axios';
import config  from './setting';

const app = express();
const client = new line.Client(config);
const PORT = process.env.PORT || 3000;

app.post('/webhook', line.middleware(config), (req, res) => {

});