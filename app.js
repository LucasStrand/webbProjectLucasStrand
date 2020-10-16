//*******************/:TODO:\************************\\
//***----validationError för allt-----------------***//
//***----fixa lite css för blogposts samt FAQ-----***\\
//***-----------hash passwords--------------------***//
//******************\:EPIC:/*************************\\


const { response, Router, request } = require('express')
const express = require('express')
const expressHandlebars = require('express-handlebars')
const bodyParser = require('body-parser')
const sqlite3 = require('sqlite3')
const expressSession = require('express-session')
const SQLiteStore = require('connect-sqlite3')(expressSession)
const multer = require('multer')
const path = require('path')


const db = new sqlite3.Database("my-database.db")


db.run(`
    CREATE TABLE IF NOT EXISTS blogposts(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        article TEXT,
        image TEXT
    )
`)

db.run(`
    CREATE TABLE IF NOT EXISTS faq(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT,
        date DATE,
        answer TEXT
        )
`)

db.run(`
    CREATE TABLE IF NOT EXISTS comments(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        comment TEXT,
        blogpostID INTEGER
        )
`)
//set storage engine
const storage = multer.diskStorage({
  destination: './public/file/',
  filename: function (request, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
})
//Init Upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 9000000 }
}).single('image')


const app = express()


app.use(expressSession({
  secret: "asdkjfhzcxvhjgasdfjhagsdcivo",
  saveUninitialized: false,
  resave: false,
  store: new SQLiteStore({
    db: "sessions.db"
  })
}))

const adminUsername = "admin"
const adminPassword = "abc123"



app.engine(".hbs", expressHandlebars({
  defaultLayout: "main.hbs"
}))

function getBlogpostValidationErrors(title, article, file) {
  const validationErrors = []
  return validationErrors
}
app.use(express.static("static"))
app.use(express.static("./public/file"))

app.use(bodyParser.urlencoded({
  extended: false
}))

app.use(function (request, response, next) {
  const isLoggedIn = request.session.isLoggedIn

  response.locals.isLoggedIn = isLoggedIn
  next()
})

app.get("/", function (request, response) {
  response.render("start.hbs")
})
app.get("/about", function (request, response) {
  response.render("about.hbs")
})
app.get("/contact", function (request, response) {
  response.render("contact.hbs")
})


app.get("/createblogpost", function (request, response) {
  if (request.session.isLoggedIn) {
    response.render("createblogpost.hbs")
  } else {
    response.redirect("/login")
  }
})



//   const title = request.body.title
//   const article = request.body.article
//   const file = request.body.file

//   const errors = getBlogpostValidationErrors(title, article, file)
//   if (!request.session.isLoggedIn) {
//     errors.push("You have to logged in to do that!")
//   }

//   if (0 < errors.length) {
//     const model = {
//       errors,
//       title,
//       article,
//       file
//     }
//     response.render("createblogpost.hbs", model)
//     return
//   }


//   const query = "INSERT INTO blogposts (title, article, file) VALUES(?, ?, ?)"
//   const values = [title, article, file]
//   db.run(query, values, function (error) {
//     if (error) {
//       console.log(error)
//     } else {
//       response.redirect("blogposts/" + this.lastID)
//     }
//   })
// })
app.post("/createblogpost", function (request, response) {

  upload(request, response, (error) => {
    if (error) {
      console.log(error, "1")
    }
    else {
      const title = request.body.title
      const article = request.body.article
      const image = request.file.filename
      console.log(image) // Prints style.css MUST FIX - Filips notes

        const query = ("INSERT INTO blogposts (title, article, image) VALUES (?, ?, ?)")
        const values = [title, article, image]

        db.run(query, values, function (error) {
          if (error) {
            console.log(error, "2")
          }
          else {
            response.redirect('/blogposts/' + this.lastID)
          }
        })
      }
  })
})



app.get("/updateblogpost/:id", function (request, response) {
  const id = request.params.id

  const query = "SELECT * FROM blogposts WHERE id = ?"
  const values = [id]

  db.get(query, values, function (error, blogpost) {
    if (error) {
      console.log(error, "3")
    } else {
      const model = {
        blogpost
      }
      response.render("updateblogpost.hbs", model)
    }
  })
})

app.post("/updateblogpost/:id", function (request, response) {
  const id = request.params.id
  const newTitle = request.body.title
  const newArticle = request.body.article
  const errors = getBlogpostValidationErrors(newTitle, newArticle)

  if (!request.session.isLoggedIn) {
    errors.push("You must be logged in to do that")
  }

  if (0 < errors.length) {
    const model = {
      errors,
      blogpost: {
        id,
        title: newTitle,
        article: newArticle
      }
    }
    response.render("updateblogpost.hbs", model)
    return
  }

  const query = (`
  UPDATE
  blogposts
  SET
  title = ?,
  article = ?
  WHERE
  id=?
  `)
  const values = [newTitle, newArticle, id]

  db.run(query, values, function (error) {
    if (error) {
      console.log(error, "4")
    } else {
      response.redirect("/blogposts/" + id)
    }
  })
})


app.get("/blogposts", function (request, response) {
  const query = "SELECT * FROM blogposts ORDER BY id"
  db.all(query, function (error, blogposts) {
    if (error) {
      console.log(error, "5")
      const model = {
        dbErrorOCcurred: true
      }
      response.render("blogposts.hbs", model)
    } else {
      blogposts.reverse()
      const model = {
        blogposts,
        dbErrorOccurred: false
      }
      console.log(model)
      response.render("blogposts.hbs", model)
    }
  })
})

app.get("/blogposts/:id", function (request, response) {

  const id = request.params.id
  
  const commentQuery = "SELECT * FROM comments"
  const values = [id]
  //let commentArr = []
  var postComments = []
  
  db.all(commentQuery, function (err, comments) {
    if (err) {
      console.log(err)
    } else {
      for (let i = 0; i < comments.length; i++) {
        if (comments[i].blogpostID == id) {
          postComments.push(comments[i])
        }
      }
    }
  })
  const blogQuery = "SELECT * FROM blogposts WHERE id =?"
  
  db.get(blogQuery, values, function (error, blogpost) {
    if (error) {
      console.log(error, "6")

    } else {
      const model = {
        blogpost,
        dbErrorOccurred: false,
        postComments
      }
      response.render("blogpost.hbs", model)
    }
  })
})
// When recieving comments
app.post("/blogpost/:id", function (request, response) {

  const id = request.params.id
  const comment = request.body.comment

  const query = "INSERT INTO comments (comment, blogpostID) VALUES(?,?)"
  const values = [comment, id]

  db.run(query, values, function (error) {
    if (error) {

      console.log(error, "7")

    } else {
      console.log('Inserted comment successfully')
      response.redirect("/blogposts/"+id)
    }
  })

})
app.post("/deleteblogpost/:id", function (request, response) {

  const id = request.params.id

  const query = "DELETE FROM blogposts WHERE id = ?"
  const values = [id]

  db.run(query, values, function (error) {
    if (error) {

      console.log(error, "7")

    } else {
      response.redirect("/blogposts")
    }
  })

})
app.get("/login", function (request, response) {
  response.render("login.hbs")
})
app.post("/login", function (request, response) {
  const enteredUsername = request.body.username
  const enteredPassword = request.body.password

  if (enteredUsername == adminUsername && enteredPassword == adminPassword) {
    //Login
    request.session.isLoggedIn = true
    response.redirect("/")
  } else {
    //display error message to user
  }
})

app.post("/logout", function (request, response) {
  request.session.isLoggedIn = false
  response.redirect("/")
})

app.get("/create-faq", function(request,response){
    
  response.render("createFaq.hbs")
})

app.post("/create-faq", function(request,response){
  const question = request.body.question
  console.log(question)
  
  const validationError = []
  // if(MIN_NAME_LENGTH <=name.length){
  //     validationError.push("Enter your name.")
  // }

  const query = "INSERT INTO faq (question, date) VALUES(?,?)"
  var date = new Date().toISOString().slice(0,10)
  const values = [question, date]

  db.run(query, values, function(error){
      if(error){
          console.log(error, "8")
          const model={
              dbError:true
          }
          response.redirect("/create-faq", model)
      }else{
          const model={
              dbError:false
          }
          response.redirect("/faq")//+this.lastID for new order page
      }
  })
})

app.get("/faq",function(request,response){
      const query = "SELECT * FROM faq ORDER BY id"
      db.all(query, function(error, faq){
          if(error){
              console.log(error, "9")
              const model={
                  dbError:true
              }
          }else
          {
              const model = 
              {
                  dbError:false,
                  faq
              }
              response.render("faq.hbs", model)
          }
      }) 
})

app.get("/faq/:id",function(request,response){

      const id = request.params.id

      const query = "SELECT * FROM faq WHERE id = ?"
      const values = [id]
      db.get(query, values, function(error, faq){
          if(error){
              console.log(error, "10")
              const model={
                  dbError:true
              }
          }else{
              const model = {
                  dbError:false,
                  faq
              }
              response.render("theFaq.hbs", model)
          } 
      }) 
})

app.get("/updatefaq/:id",function(request,response){
  if(request.session.isLoggedIn){
      const id = request.params.id

      const query = "SELECT * FROM faq WHERE id = ?"
      const values = [id]
      db.get(query, values, function(error,faq){
          if(error){
              console.log(error, "11")
              //TODO display error message
          }else{
              const model= {
                  faq
              }
              response.render("updateFaq.hbs", model)
          }
      })
  }//displaya error meddelande
})

app.post("/updatefaq/:id", function(request,response){
  
      const id = request.params.id
      const newQuestion =request.body.question
      const newanswer =request.body.answer

      const validationError = []

      if(!request.session.isLoggedIn){
          validationError.push("You have yo login.")
      }

      // if(MIN_NAME_LENGTH <=newName.length){
      //     validationError.push("Enter a name.")
      // }

      if(0< validationError){
          const model = {
              validationError,
              faq: {
                  id,
                  question: newQuestion,
                  answer: newanswer
              }
          }
          response.render("updateFaq.hbs", model)
      }

      const query = `
          UPDATE
              faq
          SET
              question = ?,
              answer = ?
          WHERE
              id = ?
      `
      //console.log(answer)
      const values =[newQuestion,newanswer, id]
      db.run(query,values, function(error){
          if(error){
              console.log(error, "12")
              //TODO display error message
          }else{
              response.redirect("/faq/"+id)
          }
      })
})

app.post("/deletefaq/:id", function(request,response){
      const id = request.params.id
      if(!request.session.isLoggedIn){
          validationError.push("You have to login.")
          //create messages in html
      }
      const query ="DELETE FROM faq WHERE id = ?"
      const values = [id]

      db.run(query, values, function(error){
          if(error){
              console.log(error, "13")
              //TODO display errorr message
          }else{
              response.redirect("/faq")
          }
      })
})


app.listen(3000)