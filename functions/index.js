const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require("express");
const app = express();
admin.initializeApp(functions.config().firebase);

const db = admin.firestore();
app.use(express.json());

async function Check(CollectionName, name) {

    const checkValue = await db.collection(CollectionName).where("name", "==", name).get();
    console.log('checkValue.size: ', checkValue.size);
    return checkValue.size;

}

async function GetAuthors(Book) {
    const ref = await db.collection("Authors").get();
    console.log('ref: ', ref);
    const Authors = [];
    ref.forEach(doc => {
        if (!Book) {
            Authors.push({ id: doc.id,
                name: doc.data().name,
                dateOfBirth: doc.data().dateOfBirth,})
        }
        else{
        let Docs = {
            id: doc.id,
            name: doc.data().name,
            dateOfBirth: doc.data().dateOfBirth,
            books: []
        }
        Authors.push(Docs);
        Book.forEach(el => {
            if (el.author == doc.id) {
                console.log(el)
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
        let ExistAuthor = await Check('Authors', req.body.name)
        console.log('ExistAuthor: ', ExistAuthor);
        if (ExistAuthor > 0) {
            res.status(400).send("{error : Author alredy exist}")
            throw "Exsist";

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
        res.status(400).send(`{error : ${e}}`)
    }

})

app.get('/get-authors', async (req, res) => {

    try {
        let Authors = await GetAuthors()
        res.status(200).send(Authors);
    } catch (e) {
        res.status(400).send(`{error : ${e}}`)
    }

})

app.get('/authors-and-books', async (req, res) => {
    try {
        let AllBooks = await GetBooks();
        console.log('Books: ', AllBooks);
        let Authors = await GetAuthors(AllBooks)

        res.status(200).send(Authors)
    } catch (e) {
        res.status(400).send(`{e : ${e}}`)
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
            console.log(el.data())
            Docs.books.push({
                id: el.id,
                name: el.data().name,
                author: el.data().author
            })
        })
        res.status(200).send(response)
    } catch (e) {
        res.status(400).send(`{error :${e}}`)
    }

})

app.post('/create-book/:id', async (req, res) => {

    try {
        let ExistBook = await Check("Books", req.body.name)
        if (ExistBook > 0) {
            res.status(400).send(`{error :  Book alredy exist }`)
            throw new Error();
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
        res.status(400).send(`{error : ${e}}`)
    }

})

app.get('/get-books', async (req, res) => {

    try {
        let AllBooks = await GetBooks()
        res.status(200).send(AllBooks);
    } catch (e) {
        res.status(400).send(`{error : ${e}}`)
    }

})
exports.api = functions.https.onRequest(app);