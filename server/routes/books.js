// modules required for routing
let createError = require('http-errors');
let express = require('express');
let router = express.Router();

// define the book model
let Book = require('mongoose').model("Book");

/* GET books List page. READ */
router.get('/', (req, res, next) => {
  // find all books in the books collection
  Book.find((err, books) => {
    if (err) {
      return console.error(err);
    }
    else {
      return res.render('books/index', {
        title: 'Books',
        books: books
      });
    }
  });

});

//  GET the Book Details page in order to add a new Book
router.get('/add', (req, res, next) => {
  res.render('books/details', {
    title: 'Add new book',
    book: {}
  });
});

// POST process the Book Details page and create a new Book - CREATE
router.post('/add', async (req, res, next) => {
  return await new Book(req.body).save()
    .then(_ => res.redirect('/books/'))
    .catch(next);
});

// GET the Book Details page in order to edit an existing Book
router.get('/:id', async (req, res, next) => {
  const bookId = req.params.id;
  return await Book.findOne({ _id: bookId })
    .then(book => {
      console.log(book);
      if (book) {
        return res.render('books/details', {
          title: 'Edit book',
          book: book
        });
      } else {
        return next(createError(404));
      }
    })
    .catch(next);
});

// POST - process the information passed from the details form and update the document
router.post('/:id', async (req, res, next) => {
  const bookId = req.params.id;
  return await Book.findOne({ _id: bookId })
    .then(book => {
      if (book) {
        return book.set(req.body).save()
          .then(_ => res.redirect('/books/'));
      } else {
        return next(createError(404));
      }
    }).catch(next);
});

// GET - process the delete by user id
router.get('/delete/:id', async (req, res, next) => {
  const bookId = req.params.id;
  return await Book.deleteMany({ _id: bookId })
    .then(_ => res.redirect('/books/'))
    .catch(next);
});


module.exports = router;
