require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser')

const app = express()
app.listen(3000)

app.use(express.json())

const User = require('./models/User')

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);


app.get('/Teste', (req, res) => {
    res.status(200).json({ mensagem: 'Bem vindo a API'})
});

const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS


mongoose
    .connect(
        `mongodb+srv://${dbUser}:${dbPassword}@cluster0.ngaevqw.mongodb.net/?retryWrites=true&w=majority`
    )
    .then(() => {
    
    console.log('Conectou ao banco!')
    })
    .catch((err) => console.log(err))


// Criação de cadastro - Sing Up 
app.post('/singup', async (req, res) => {
    const { name, email, password, telephones } = req.body;

    if (!name) {
        return res.status(422).json({ mensagem: 'Insira o nome' });
    }

    if (!email) {
        return res.status(422).json({ mensagem: 'Insira o email' });
    }

    if (!password) {
        return res.status(422).json({ mensagem: 'Insira a palavra-passe' });
    }

    if (!telephones) {
        return res.status(422).json({ mensagem: 'O telefone é obrigatório' });
    }

    // Confirmação do usuário
    const userExists = await User.findOne({ email: email });
    if (userExists) {
        return res.status(422).json({ mensagem: 'Email já existente!' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Criação do usuário
    const user = new User({
        name,
        email,
        password: passwordHash,
        telephones,
    });
    try {
        await user.save();
        res.status(201).json({ mensagem: 'Usuário criado com sucesso' });
    } catch (error) {
        res.status(500).json({ mensagem: error });
    }
});

// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email) {
        return res.status(422).json({ mensagem: 'Insira o email' });
    }

    if (!password) {
        return res.status(422).json({ mensagem: 'Insira a palavra-passe' });
    }

    // Lógica de autenticação aqui

    // Exemplo: verificar usuário no banco de dados
    const user = await User.findOne({ email: email });

    if (!user) {
        return res.status(401).json({ mensagem: 'Usuário e/ou senha inválidos' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        return res.status(401).json({ mensagem: 'Usuário e/ou senha inválidos' });
    }

    // Geração do token JWT
    const tokenSecret = process.env.SECRET 
    const token = jwt.sign({ userId: user._id }, tokenSecret, { expiresIn: '30min' });


    res.status(200).json({ token: token });
});