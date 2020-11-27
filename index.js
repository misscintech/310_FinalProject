//all the imports
import express from 'express';
import exphbs  from 'express-handlebars';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import sqlite3 from 'sqlite3';
import {open} from 'sqlite';
import { grantAuthToken, lookupUserFromAuthToken } from "./auth";

export const dbPromise = open({filename: "data.db", driver: sqlite3.Database});

const app = express();

app.engine("handlebars",exphbs());
app.set("view engine", "handlebars");

//all the app.use:
app.use(cookieParser());
app.use(express.urlencoded({extended: false}));
app.use('/static',express.static(__dirname + '/static'));

app.use(async(req,res,next)=>{
    const {authToken} = req.cookies;
    if(!authToken){return next();}
    try{
        const user = await lookupUserFromAuthToken(authToken);
        req.user = user;
    }catch(e){
        return next({message: e,status: 500});
    }
    next();
});

//All the gets!
app.get("/", async (req, res) => {
    const db = await dbPromise;
    const messages = await db.all(`SELECT
      Messages.id,
      Messages.content,
      Users.username as authorName
    FROM Messages LEFT JOIN Users WHERE Messages.authorId = Users.id AND boardId == 1`);
    console.log('messages', messages);
    res.render("home", { messages, user: req.user });
  });
  /*
  app.get("/mboardCa", async (req, res) => {
    const db = await dbPromise;
    const messages = await db.all(`SELECT
      Messages.id,
      Messages.content,
      Users.username as authorName
    FROM Messages LEFT JOIN Users WHERE Messages.authorId = Users.id AND boardId == 2`);
    console.log('messages', messages);
    res.render("mboardCa", { messages, user: req.user });
  });
  app.get("/mboardCb", async (req, res) => {
    const db = await dbPromise;
    const messages = await db.all(`SELECT
      Messages.id,
      Messages.content,
      Users.username as authorName
    FROM Messages LEFT JOIN Users WHERE Messages.authorId = Users.id AND boardId == 3`);
    console.log('messages', messages);
    res.render("mboardCb", { messages, user: req.user });
  });*/
app.get('/register',(req,res)=>{
    if(req.user){return res.redirect('/')};
    res.render('register');
 });

 app.get('/login',(req,res)=>{
    if(req.user){return res.redirect('/')};
    res.render('login');
 });
 //my attempt to do logout. Chuck told me to do res.clearCookie so it makes sense 
 //to me to clear the authtokens to delete your session but that didn't work so I tried classic sql query and that seems to work.
 
 app.get('/logout', async (req,res)=>{
    const db = await dbPromise;
    res.cookie('token','',{maxAge:0});
    await db.run('DELETE FROM AuthTokens WHERE token=?',req.cookies.authToken); 
    res.redirect('/');
 });
 //all the posts! 

 app.post('/register',async(req,res)=>{
    const db = await dbPromise;
    const {
        username,
        email,
        password
     } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    try{
        await db.run('INSERT INTO Users (username, email, password) VALUES (?, ?, ?);',
        username,
        email,
        passwordHash
      )
      const user = await db.get('SELECT id FROM Users WHERE email=?', email);
      const token = await grantAuthToken(user.id);
        res.cookie('authToken',token);
        res.redirect('/');
    }
    catch(e){
        return res.render('register', {error: e })
    }
 });

 app.post('/login',async(req,res)=>{
    const db = await dbPromise;
    const { email,password} = req.body;
     try{
        const existingUser = await db.get("SELECT * FROM USERS WHERE email=?", email);
        if(!existingUser){
            throw 'login incorrect';
        }
        const passwordMatch = await bcrypt.compare(password, 
            existingUser.password);
        if(!passwordMatch){
            throw 'login incorrect';
        }
        const token = await grantAuthToken(existingUser.id);
        res.cookie('authToken',token);
        res.redirect('/');
    }
    catch(e){
        return res.render('login', {error: e })
    }
 });

 app.post("/message", async (req, res, next) => {
    if (!req.user) {
      return next({status: 401,message: 'must be logged in to post'});
    }
    const db = await dbPromise;
    await db.run('INSERT INTO Messages (content, authorId, boardId) VALUES (?, ?, 1);',
    req.body.message, req.user.id)
    res.redirect("/");
  });
/*
  app.post("/mboardCa", async (req, res, next) => {
    if (!req.user) {
      return next({status: 401,message: 'must be logged in to post'});
    }
    const db = await dbPromise;
    await db.run('INSERT INTO Messages (content, authorId, boardId) VALUES (?, ?, 2);',
    req.body.message, req.user.id)
    res.redirect("/mboardCa");
  });

  app.post("/mboardCb", async (req, res, next) => {
    if (!req.user) {
      return next({status: 401,message: 'must be logged in to post'});
    }
    const db = await dbPromise;
    await db.run('INSERT INTO Messages (content, authorId, boardId) VALUES (?, ?, 3);',
    req.body.message, req.user.id)
    res.redirect("/mboardCb");
  });
*/
  //time for all the app.use for errors

app.use((req,res,next)=>{
    next({
        status:404,
        message: '${req.path} not found'
    });
});

app.use((err,req,res,next)=>{
    res.status(err.status || 500);
    console.log(err);
    res.render('errorPage',{error: err.message || err});
});

//setup

const setup = async()=>{
    const db = await dbPromise;
    await db.migrate({force: true});
    app.listen(8080, ()=>{
        console.log("listening on http://localhost:8080")
    
    });
}
setup();