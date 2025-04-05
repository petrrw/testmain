const express = require("express")
const cors = require("cors")
const app = express()
const port = 3001
app.use(cors())

const jwt = require("jsonwebtoken")

app.use(express.json())

let users = [
    {
        username: "test",
        password: "123"
    }
]

const posts = [
    {
        username: "Kyle",
        title: "Post 1"
    },
    {
        username: "Jim",
        title: "Post 2"
    }
]

let refreshTokens = []

app.delete("/logout", (req, res) => {
    const receivedToken = req.body.token
    console.log(receivedToken)
    refreshTokens = refreshTokens.filter(token => token != receivedToken)
    res.sendStatus(204)
})

app.post("/token", (req, res) => {
    const refreshToken = req.body.token
    if(refreshToken == null)
        res.sendStatus(401)

    if(!refreshTokens.includes(refreshToken)) return res.sendStatus(403)
    jwt.verify(refreshToken, "f1ce1edee0b5b5ade91812ac1ac7c7de7b5e08b8ae4f37237629e4287d2389dad9f59d205401dbada0169f77a4572c915d1a6c357eacb05195170d7bb0fa5c90", (err, user) => {
        if(err)
            return res.sendStatus(403)

        const accessToken = generateAccessToken({user: user.name})
        res.json({accessToken: accessToken})
    })

})

app.post("/register", (req, res) => {
    const username = req.body.username
    const password = req.body.password

    if(users.some(item => item.username == username))
        return res.status(409).send("User already exists")

    users.push({username, password})

    res.sendStatus(201)
})

// Authenticates user
app.post("/login", (req, res) => {
    console.log("received")
    const username = req.body.username
    const password = req.body.password
    console.log(users)
    if(!users.some(item => item.username == username && item.password == password))
        return res.status(404).send("Invalid username or password")

   // console.log(req.body)
    const user = {name: username}

    const accessToken = generateAccessToken(user)
    const refreshToken = jwt.sign(user, 'f1ce1edee0b5b5ade91812ac1ac7c7de7b5e08b8ae4f37237629e4287d2389dad9f59d205401dbada0169f77a4572c915d1a6c357eacb05195170d7bb0fa5c90')
    refreshTokens.push(refreshToken)
    res.json({accessToken: accessToken, refreshToken})
})  

app.get("/posts", authenticateToken, (req, res) => {
    console.log(req.user)
    res.json(posts.filter(post => post.username == req.user))
})

function generateAccessToken(user){
    return jwt.sign(user, "a08475d11dfa6703d05f1750c3d79f5dd6fa80fae8c97d345979de603a03840e146d1617fe77e6ccd46b2e4b8c3bc9273a0269c0cc080010d944b3f8e6c2b150", {expiresIn: "15s"})
}

function authenticateToken(req, res, next){
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]
 
    if(token == null) return res.sendStatus(401)

    jwt.verify(token, "a08475d11dfa6703d05f1750c3d79f5dd6fa80fae8c97d345979de603a03840e146d1617fe77e6ccd46b2e4b8c3bc9273a0269c0cc080010d944b3f8e6c2b150", (err, user) => {
        if(err)
            return res.sendStatus(403)
        req.user = user.name
        console.log("authenticated: ", user.name)
        next()
    })

}

app.listen(port, () => console.log("Server running on port " + port))