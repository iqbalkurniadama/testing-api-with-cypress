// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })


Cypress.Commands.add("resetUsers", () => {
  cy.request("DELETE","/auth/reset")
})

// global fucntion and validation massage
Cypress.Commands.add("badRequest", (response, messages = []) => {
  expect(response.status).to.eq(400)
  expect(response.body.error).to.eq('Bad Request')
  messages.forEach(message => {
    expect(message).to.be.oneOf(response.body.message)
  })
})

Cypress.Commands.add('unauthorized', (response) => {
  expect(response.status).to.eq(401)
  expect(response.body.message).to.eq("Unauthorized")
})

Cypress.Commands.add('checkUnauthorized', (method, url) => {
  cy.request({
    method,
    url,
    headers: {
      authorization: null,
    },
    failOnStatusCode: false,
  }).then((response) => {
    cy.unauthorized(response)
  })
})

/**
 * catatan :
 * 1. cara ini jika tidak menggunakan database dummy atau database yang berupa array.
 * 2. jika menggunakan database asli langsung membuat user di database yang sudah register.
 */

Cypress.Commands.add('login', () => {
  // membbuat data user
  const userData = {
    name: 'John Doe',
    email: 'john@nest.test',
    password: "Secret_123",
  }
  
  // menghapus data user yang sudah ada di database 
  cy.resetUsers()
  
  // membuat user baru 
  cy.request({
    method: 'POST',
    url: '/auth/register',
    body: userData,
  })

  // login user yang sudah dibuat dan save token sesuai access token
  cy.request({
    method: 'POST',
    url: '/auth/login',
    body: {
      email: userData.email,
      password: userData.password
    },
  }).then((response) => {
    Cypress.env('token', response.body.data.access_token)
  })
})

/**
 * catatan :
 * 1. ._. = lodash merupakan package dari JS yang memiliki method yang banyak.
 * 2. faker = package untuk membuat data dummy.
 */

// membuat data post.json
Cypress.Commands.add('generatePostsData', (count) => {
  const {faker} = require('@faker-js/faker')

  cy.writeFile('cypress/fixtures/posts.json', Cypress._.times(count, () => {
    return {
      title: faker.lorem.words(3),
      content: faker.lorem.paragraphs(3)
    }
  }))
})

// command create post 
Cypress.Commands.add('createPost', (data = []) => {
  cy.login()

  // reset posts
  cy.request({
    method: 'DELETE',
    url: '/posts/reset',
    headers: {
      authorization: `Bearer ${Cypress.env('token')}`,
    }
  })

  // create posts
  data.forEach((_post) => {
    cy.request({
      method: 'POST',
      url: '/posts',
      headers: {
        authorization: `Bearer ${Cypress.env('token')}`,
      },
      body: _post
    })
  }) 
})

// membuat data comment.json
Cypress.Commands.add('genereteCommentData', (count) => {
  const {faker} = require('@faker-js/faker')

  cy.request({
    method: 'DELETE',
    url: '/comments/reset',
    headers: {
      authorization: `Bearer ${Cypress.env('token')}`,
    }
  })

  cy.generatePostsData(3)
  cy.fixture('posts').then(posts => cy.createPost(posts))
  
  cy.writeFile('cypress/fixtures/comments.json', Cypress._.times(count, () => {
    return {
      post_id: faker.datatype.number({min: 1, max: 3}),
      content: faker.lorem.words(5)
    }
  }))
})
