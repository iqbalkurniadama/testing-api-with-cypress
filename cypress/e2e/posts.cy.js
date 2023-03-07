describe('Post module', () => { 
  before('login', () => {
    cy.login()
  })
  
  const dataCount = 15
  const rondomId = Cypress._.random(16, 50)

  before('generate posts data', () => cy.generatePostsData(dataCount))

  describe('Create post', () => {
    
    /**
     * 1. return unauthorized
     * 2. return erro validation
     * 3. return correct post
     */

    // negative scanario
    it('should return unauthorized', () => {
      cy.checkUnauthorized('POST', '/posts')
    })

    it('should return error validation message', () => {
      cy.request({
        method: 'POST',
        url: '/posts',
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.badRequest(response, [
          "title must be a string",
          "content must be a string"
        ])
      })
    })

    // positive scanario
    it('should return correct post', () => {
      cy.fixture("posts").then((postData) => {
        cy.request({
          method: 'POST',
          url: '/posts',
          headers: {
            authorization: `Bearer ${Cypress.env('token')}`,
          },
          body: {
            title: postData[0].title,
            content: postData[0].content,
          }
        }).then((response) => {
          const { 
            success, 
            data: {title, content, comments} 
          } = response.body
          expect(response.status).to.eq(201)
          expect(success).to.be.true
          expect(title).to.eq(postData[0].title)
          expect(content).to.eq(postData[0].content)
          expect(comments.length).to.eq(0)
        })
      })
    })
  })

  describe('Get all posts', () => {
    /**
     * 1. return unauthorized
     * 2. return correct count and data
     */

    it('should return unauthorized', () => {
      cy.checkUnauthorized('GET', '/posts')
    })

    it('should return correct count and data', () => {
      cy.fixture('posts').then((postData) => {
        cy.createPost(postData)
        
        // get all posts
        cy.request({
          method: 'GET',
          url: '/posts',
          headers: {
            authorization: `Bearer ${Cypress.env('token')}`,
          },
        }).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.success).to.be.true
          expect(response.body.data.length).to.eq(postData.length)

          postData.forEach((_post, index) => {
            expect(response.body.data[index].id).to.eq(index + 1)
            expect(response.body.data[index].title).to.eq(_post.title)
            expect(response.body.data[index].content).to.eq(_post.content)
          });
        })

      })
    })
  })

  describe('Get by ID', () => {
    /**
     * 1. return unauthorized
     * 2. retutn correct data
     * 3. return not found
     */
    
    it('should return unauthorized', () => {
      cy.checkUnauthorized('GET', '/posts/900')
    })

    it('should return correct data', () => {
      cy.fixture('posts').then((postData) => {
        postData.forEach((_post, index) => {
          cy.request({
            method: 'GET',
            url: `/posts/${index + 1}`,
            headers: {
              authorization: `Bearer ${Cypress.env('token')}`,
            },
          }).then(response => {
            const {title, content} = response.body.data
            expect(response.status).to.eq(200)
            expect(title).to.eq(_post.title)
            expect(content).to.eq(_post.content)
          })
        })
      })
    })

    it('should return not found', () => {
      cy.request({
        method: 'GET',
        url: `/posts/${rondomId}`,
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.eq(404)
        expect(response.body.success).to.be.false
        expect(response.body.data).to.be.null
      })
    })

  })

  describe('Update post', () => {
    /**
     * 1. return unauthorized
     * 2. return not found
     * 3. return error validation message
     * 4. return correct updated post 
     */

    it('should return unauthorized', () => {
      cy.checkUnauthorized('PATCH', '/posts/1234')
    })

    it('should return not found', () => {
      cy.request({
        method: 'PATCH',
        url: `/posts/${rondomId}`,
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.eq(404)
        expect(response.body.success).to.be.false
        expect(response.body.data).to.be.null
      })
    })
    
    it('should return error validation', () => {
      cy.request({
        method: 'PATCH',
        url: `/posts/1`,
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
        body: {
          title: false,
          content: rondomId,
        },
        failOnStatusCode: false,
      }).then(response => {
        cy.badRequest(response, ["title must be a string", "content must be a string"])
      })
    })

    it('should return correct updated post', () => {
      const updatedPost = {
        id: 1,
        title: 'updated title',
        content: 'updated content',
      }

      // uddate post
      cy.request({
        method: 'PATCH',
        url: `/posts/${updatedPost.id}`,
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
        body: {
          title: updatedPost.title,
          content: updatedPost.content,
        },
      }).then(response => {
        const {success, data: {title, content}} = response.body
        expect(response.status).to.eq(200)
        expect(success).to.be.true
        expect(title).to.eq(updatedPost.title)
        expect(content).to.eq(updatedPost.content)
      })

      // check get by id
      cy.request({
        method: 'GET',
        url: `/posts/${updatedPost.id}`,
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
      }).then(response => {
        const {title, content} = response.body.data
        expect(response.status).to.eq(200)
        expect(title).to.eq(updatedPost.title)
        expect(content).to.eq(updatedPost.content)
      })

      // check get all posts
      cy.request({
        method: 'GET',
        url: '/posts',
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
      }).then((response) => {
        const post = response.body.data.find(
          (_post) => _post.id === updatedPost.id
        )
        expect(post.title).to.eq(updatedPost.title)
        expect(post.content).to.eq(updatedPost.content)
      })
    })
  })

  describe('Delete post', () => {
    /**
     * 1. return unauthorized
     * 2. return not found
     * 3. successfully delete the post
     * 4. not be found the deleted post
     */

    it('should return unauthorized', () => {
      cy.checkUnauthorized('DELETE', '/posts/1232')
    })

    it('should return not found', () => {
      cy.request({
        method: 'DELETE',
        url: `/posts/${rondomId}`,
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.eq(404)
        expect(response.body.success).to.be.false
        expect(response.body.data).to.be.null
      })
    })

    it('should success remove the post', () => {
      cy.request({
        method: 'DELETE',
        url: `/posts/1`,
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
      }).then(response => {
        expect(response.status).to.eq(200)
        expect(response.body.success).to.be.true
        expect(response.body.message).to.eq('Post deleted successfully')
      })
    })

    it('should not be found the deleted post', () => {
      // check get by id
      cy.request({
        method: 'GET',
        url: `/posts/1`,
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.eq(404)
      })

      // check get all posts
      cy.request({
        method: 'GET',
        url: '/posts',
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
      }).then((response) => {
        const post = response.body.data.find(
          (_post) => _post.id === 1
        )
        expect(post).to.be.undefined
      })
    })
  })
})