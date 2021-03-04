// modules required for routing
let createError = require('http-errors');
let express = require('express');
let router = express.Router();
const { validationResult, checkSchema } = require('express-validator');

// define the book model
let Book = require('mongoose').model("Book");

//Custom validator to reject empty string.
const matchNonEmpty = msg => {
  return {
    options: /^( *)$/,
    errorMessage: `${msg} cannot be empty.`,
    negated: true
  }
};
// Validator middleware used by "POST=/books/add" and "POST=/books/:id".
const bookFormValidation = checkSchema({
  Title: {
    isLength: {
      trim: true,
      errorMessage: 'Book\'s title must have atleast 1 character.',
      options: { min: 1 }
    },
    matches : matchNonEmpty('Book\'s title')
  },
  Price: {
    isNumeric: {
      errorMessage: 'Book\'s price must be a number.',
    },
    custom: {
      options: (value) => {
        return value >= 0.0;
      },
      errorMessage: 'The price for a book cannot be less than $0.0',
    }
  },
  Author: {
    isLength: {
      trim: true,
      errorMessage: 'Book\'s author must have atleast 1 character.',
      options: { min: 1 }
    },
    matches : matchNonEmpty('Book\'s author')
  },
  Genre: {
    isLength: {
      trim: true,
      errorMessage: 'Book\'s Genre must have atleast 1 character.',
      options: { min: 1 }
    },
    matches : matchNonEmpty('Book\'s Genre')
  }
});

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
  //Lookup book from previously submitted form that was rejected.
  const book = req.flash('book')[0];
  res.render('books/details', {
    title: 'Add new book',
    book: book ? book : {}
  });
});

// POST process the Book Details page and create a new Book - CREATE
router.post('/add', bookFormValidation, async (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    //If form validation failed. then redirect the user to the form
    //and flash the previous form and the appropriate errors to the view.
    const errStrings = result.errors.map(e => e.msg);
    req.flash("error", errStrings);
    req.flash("book", req.body);
    return res.status(400).redirect("/books/add");
  } else {
    //Otherwise save the form object and redirect to the books index page.
    return await new Book(req.body).save()
      .then(_ => res.redirect('/books/'))
      //forward any unexpected errors to the default error hander
      .catch(next);
  }
});

// GET the Book Details page in order to edit an existing Book
router.get('/:id', async (req, res, next) => {
  const bookId = req.params.id;
  const bookFormData = req.flash('book')[0];
  //If a book data from a form is already available,
  //we will not fetch the book from storage again.
  const bookPromise = bookFormData ?
    Promise.resolve(bookFormData) :
    Book.findOne({ _id: bookId });
  return await bookPromise
    .then(book => {
      if (book) {
        //If we have a book, then we will successfuly render
        //the view.
        return res.render('books/details', {
          title: 'Edit book',
          book: book
        });
      } else {
        //Otherwise forward a 404 to the default handler.
        return next(createError(404));
      }
    })
    //forward any unexpected errors to the default error hander
    .catch(next);
});

// POST - process the information passed from the details form and update the document
router.post('/:id', bookFormValidation, async (req, res, next) => {
  const bookId = req.params.id;
  const result = validationResult(req);
  if (!result.isEmpty()) {
    //If form validation failed. then redirect the user to the form
    //and flash the previous form and the appropriate errors to the view.
    const errStrings = result.errors.map(e => e.msg);
    req.flash("error", errStrings);
    req.flash("book", req.body);
    return res.status(400).redirect("/books/" + bookId);
  } else {
    //Otherwise Look for the book in storage to edit.
    return await Book.findOne({ _id: bookId })
      .then(book => {
        if (book) {
          //If the book exists, save the updated version, and 
          //then redirect the user to the books index page.
          return book.set(req.body).save()
            .then(_ => res.redirect('/books/'));
        } else {
          //Otherwise forward a 404 to the default handler.
          return next(createError(404));
        }
      })
      //forward any unexpected errors to the default error hander
      .catch(next);
  }
});

// GET - process the delete by user id
router.get('/delete/:id', async (req, res, next) => {
  const bookId = req.params.id;
  return await Book.deleteMany({ _id: bookId })
  //Since DELETE is idempotent, we will always treat the delete
  //operation as successful regardless of whether any books were 
  //found or not.
    .then(_ => res.redirect('/books/'))
    //forward any unexpected errors to the default error hander
    .catch(next);
});

module.exports = router;
