const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://discord.com/api/webhooks/1521127035030864024/OKXG67lszXDCuRSU4IhM9Yj3jYiijb8-5TCKfVgknaeffyINyJ6ZnZNUGn_i2gDT2cH2';
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://yundawon209_db_user:<db_password>@cluster0.edffvzp.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('🟢 몽고DB 연결 성공! 매일 1회 서버가 재부팅되어도 데이터가 초기화되지 않습니다.');
    sendDiscordLog('🟢 **서버 시스템 가동**: 몽고DB 데이터베이스 연결 완료!');
  })
  .catch(err => {
    console.error('🔴 몽고DB 연결 실패:', err);
  });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

async function sendDiscordLog(message) {
    if (!WEBHOOK_URL || WEBHOOK_URL.includes('내_디스코드')) return;
    
    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message })
        });
    } catch (error) {
        console.error('디스코드 웹훅 전송 실패:', error.message);
    }
}

app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: '아이디와 비밀번호를 입력해주세요.' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: '이미 사용 중인 아이디입니다.' });
        }

        const newUser = new User({ username, password });
        await newUser.save();

        console.log(`👤 새 회원가입 완료: ${username}`);
        sendDiscordLog(`👤 **새 회원가입 알림**: \`${username}\`님이 새로 가입하셨습니다.`);

        res.json({ success: true, message: '회원가입이 성공적으로 완료되었습니다!' });
    } catch (error) {
        console.error('회원가입 에러:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: '아이디와 비밀번호를 입력해주세요.' });
        }

        const user = await User.findOne({ username });
        
        if (!user || user.password !== password) {
            return res.status(400).json({ success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
        }

        console.log(`🔓 로그인 성공: ${username}`);
        sendDiscordLog(`🔓 **로그인 감지**: \`${username}\`님이 가상 대시보드 시스템에 접속했습니다.`);

        res.json({ 
            success: true, 
            message: '로그인에 성공했습니다!', 
            user: { username: user.username } 
        });
    } catch (error) {
        console.error('로그인 에러:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 서버가 포트 ${PORT}에서 활성화되었습니다.`);
});
