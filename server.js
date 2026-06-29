const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const users = [];
const ipCounts = {};

app.post('/api/register', (req, res) => {
    const { nickname, password } = req.body;
    const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!nickname || !password) {
        return res.status(400).json({ message: "닉네임과 비밀번호를 모두 입력해주세요." });
    }

    const existsUser = users.find(u => u.nickname === nickname);
    if (existsUser) {
        return res.status(400).json({ message: "이미 존재하는 닉네임입니다." });
    }

    const currentIpCount = ipCounts[userIP] || 0;
    if (currentIpCount >= 2) {
        return res.status(400).json({ message: "이 IP에서는 더 이상 계정을 생성할 수 없습니다. (최대 2개)" });
    }

    users.push({ nickname, password, ip: userIP });
    ipCounts[userIP] = currentIpCount + 1;

    return res.status(200).json({ message: "회원가입이 성공적으로 완료되었습니다!" });
});

app.post('/api/login', (req, res) => {
    const { nickname, password } = req.body;
    const user = users.find(u => u.nickname === nickname && u.password === password);
    if (!user) {
        return res.status(400).json({ message: "닉네임 또는 비밀번호가 틀렸습니다." });
    }
    return res.status(200).json({ message: "로그인 성공!", nickname: user.nickname });
});

app.listen(3000, () => {
    console.log('서버가 3000번 포트에서 돌아가는 중입니다!');
});
