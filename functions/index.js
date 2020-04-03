const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require("express");
const app = express();
admin.initializeApp(functions.config().firebase);

const db = admin.firestore();
app.use(express.json());

async function Check(CollectionName, names) {

    const checkValue = await db.collection(CollectionName).get();
    let chekName = '';
    checkValue.forEach(doc => {
        let data = doc.data()
        if (data.name == names) {
            chekName = doc.data().name;
        }
        if(doc.id == names){
            chekName = doc.id;
        }
    })
    return chekName

}

async function GetAuthors(Book) {
    const ref = await db.collection("Authors").get();
    const Authors = [];
    ref.forEach(doc => {
        if (!Book) {
            Authors.push({
                id: doc.id,
                name: doc.data().name,
                dateOfBirth: doc.data().dateOfBirth,
            })
        } else {
            let Docs = {
                id: doc.id,
                name: doc.data().name,
                dateOfBirth: doc.data().dateOfBirth,
                books: []
            }
            Authors.push(Docs);
            Book.forEach(el => {
                if (el.author == doc.id) {
                    Docs.books.push(el)
                }
            })
        }
    })
    return Authors;
}

async function GetBooks() {
    const ref = await db.collection("Books").get();
    const Books = [];
    ref.forEach(doc => {
        Books.push({
            id: doc.id,
            name: doc.data().name,
            author: doc.data().author
        })
    })
    return Books
}

app.post('/create-author', async (req, res) => {

    try {
        if (!req.body.name || !req.body.birth) {
            let Error = {
                Error: "Some of this value is undefined (name, birth)"
            }
            throw Error
        }
        var count = Object.keys(req.body).length
        if (count > 2) {
            let Error = {
                Error: "Send just name and date of birth"
            }
            throw Error
        }
        let ExistAuthor = await Check('Authors', req.body.name)
        if (ExistAuthor == req.body.name) {
            let err = {
                error: " Author alredy exist"
            }
            throw err

        }

        let Author = {
            name: req.body.name,
            dateOfBirth: req.body.birth,
        }

        const NewDoc = await db.collection('Authors').add(Author);
        res.status(200).send({
            id: NewDoc.id
        });
    } catch (e) {
        res.status(400).json(e)
    }

})

app.get('/get-authors', async (req, res) => {

    try {
        let Authors = await GetAuthors()
        res.status(200).send(Authors);
    } catch (e) {
        res.status(400).json(e)
    }

})

app.get('/authors-and-books', async (req, res) => {
    try {
        let AllBooks = await GetBooks();
        let Authors = await GetAuthors(AllBooks)

        res.status(200).send(Authors)
    } catch (e) {
        res.status(400).json(e)
    }
})

app.get("/get-author/:id", async (req, res) => {

    try {
        let response = [];
        const id = req.params.id
        let ref = await db.collection('Authors').doc(id).get();
        let Docs = {
            id: id,
            name: ref.data().name,
            dateOfBirth: ref.data().dateOfBirth,
            books: []
        }
        response.push(Docs)
        let books = await db.collection('Books').where("author", '==', id.toString()).get();
        await books.forEach(el => {
            Docs.books.push({
                id: el.id,
                name: el.data().name,
                author: el.data().author
            })
        })
        res.status(200).send(response)
    } catch (e) {
        res.status(400).json(e)
    }

})

app.post('/create-book/:id', async (req, res) => {

    try {
        if (!req.body.name) {
            let Error = {
                Error: "Some of this value is undefined (name)"
            }
            throw Error
        }
        let count = Object.keys(req.body).length
        if (count > 1) {
            let Error = {
                Error: "Send just (name)"
            }
            
            throw Error
        }
        let CheckAuthor = await Check('Authors', req.params.id)
        if (CheckAuthor != req.params.id) {
            let Error = {
                Error: "Author isn`t exist"
            }
           
            throw Error
        }
        let ExistBook = await Check("Books", req.body.name)
        if (ExistBook == req.body.name) {
            let Error = {
                Error: 'Book alredy exsist'
            }
          
            throw Error
        }
        let Book = {
            name: req.body.name,
            author: req.params.id
        }
        const newList = await db.collection('Books').add(Book);
        res.status(200).send({
            id: newList.id
        });
    } catch (e) {
        res.status(400).json(e)
    }

})

app.get('/get-books', async (req, res) => {

    try {
        let AllBooks = await GetBooks()
        res.status(200).send(AllBooks);
    } catch (e) {
        res.status(400).json(e)
    }

})
exports.api = functions.https.onRequest(app);