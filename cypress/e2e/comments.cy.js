describe('Comment module', () => { 
  const deletedId = Cypress._.random(1, 5)
  
  before('login', () => {
    cy.login()
  })

  describe('Create comment', () => {
    /**
     * 1. return unauthorized
     * 2. return error validation
     * 3. return correct comments
     * 4. found in get post by id endpoint (detail post belum di ambil semuannya, cari cara ambil semua)
     * 5. found in all posts endpoint
     */

    it('return unauthorized', () => {
      cy.checkUnauthorized('POST', '/comments')
    })

    it('should return error validation massage', () => {
      cy.request({
        method: 'POST',
        url: '/comments',
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
        failOnStatusCode: false
      }).then((response) => {
        cy.badRequest(response, [
          "post_id should not be empty",
          "post_id must be a number conforming to the specified constraints",
          "content should not be empty",
          "content must be a string",
        ])
      })
    })

    it('should return correct comments', () => {
      cy.genereteCommentData(5)

      cy.fixture('comments').then((commentsData) => {
        commentsData.forEach(_comment => {
          cy.request({
            method: 'POST',
            url: '/comments',
            headers: {
              authorization: `Bearer ${Cypress.env('token')}`,
            },
            body: _comment
          }).then((response) => {
            const {success, data: {post_id, content}} = response.body
            expect(response.status).to.eq(201)
            expect(success).to.be.true
            expect(post_id).to.eq(_comment.post_id)
            expect(content).to.eq(_comment.content)
          })
        })
      })
    })

    it('should be found in get post by id endpoint', () => {
      cy.fixture('comments').then((commentData) => {
        cy.request({
          method: 'GET',
          url: `/posts/${commentData[0].post_id}`,
          headers: {
            authorization: `Bearer ${Cypress.env('token')}`,
          }
        }).then((response) => {
          const {comments} = response.body.data
          const isFound = comments.some(comment => comment.content === commentData[0].content)

          expect(comments).to.be.ok
          expect(isFound).to.be.ok
        })
      })
    })

    it('should be found in gey all posts endpoint', () => {
      cy.request({
        method: 'GET',
        url: '/posts',
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        }
      }).then((response) => {
        cy.fixture('comments').then((commentData) => {
          const posts = response.body.data

          commentData.forEach(comment => {
            const isFound = posts
              .find((post) => post.id === comment.post_id)
              .comments.some((_comment) => _comment.content === comment.content)
            
            expect(isFound).to.be.ok
          })
        })
      })
    })
  })

  describe('Delete comment', () => {
    /**
     * 1. return unauthorized
     * 2. return not found
     * 3. successfully delete comment
     * 4. not found in detail post endpoint
     */

    it('return unauthorized', () => {
      cy.checkUnauthorized('DELETE', '/comments/5')
    })

    it('should return not found', () => {
      cy.request({
        method: 'DELETE',
        url: `/comments/${Cypress._.random(6, 10)}`,
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404)
      })
    })

    it('should successfully delete comment', () => {
      cy.request({
        method: 'DELETE',
        url: `/comments/${deletedId}`,
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
      }).then((response) => {
        const {message, success} = response.body

        expect(response.status).to.eq(200)
        expect(message).to.eq("Comment deleted successfully")
        expect(success).to.be.true
      })
    })

    it('should not be found in detail post endpoint', () => {
      cy.fixture('comments').then((commentData) => {
        const deleteComment = commentData[deletedId - 1]

        cy.request({
          method: 'GET',
          url: `/posts/${deleteComment.post_id}`,
          headers: {
            authorization: `Bearer ${Cypress.env('token')}`,
          },
        }).then(response => {
          const {comments} = response.body.data
          const isFound = comments.some(
            (comment) => 
              comment.id === deletedId && 
              comment.content === deleteComment.content,
            )

          expect(isFound).to.be.false
        })
      }) 
    })
  })
})