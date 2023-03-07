/**
 * catatan :
 * 1. cara debug : cy.log(response)
 * 2. expect berfungsi untuk validasi dan cek apakah hasilnya sesuai dengan yang 
 * diharapkan
 * 3. failOnStatusCode : false, untuk mengabaikan error code
 * 4. oneOf : untuk memvalidasi apakah value yang diharapkan ada di dalam array
 * 5. resetUsers : untuk menghapus data user yang sudah ada di database
 * 6. to.be : untuk memvalidasi apakah value yang diharapkan sama dengan value yang baiasanya berupa tipe data boolean
 * 7. not.to.be : untuk memvalidasi apakah value yang diharapkan tidak sama dengan value yang baiasanya berupa tipe data boolean, number, string
 * 8. to.eq : untuk memvalidasi apakah value yang diharapkan sama dengan value yang berupa string atau number
 * 9. only : untuk menjalankan satu test case
 * 10. before : untuk menjalankan sebelum test case dijalankan, jadi before tersebut akan dijalankan terlebih dahulu
 */

describe('Auth module', () => {
  const userData = {
    name: 'John Doe',
    email: 'john@nest.test',
    password: "Secret_123",
  }
  
  describe('register', () => {
    
    /**
     * step :
     * 1. error validation (null name, email, password)
     * 2. cek error invalid email format
     * 3. error invalid password format
     * 4. register successfully
     * 5. error duplicate entry
     */

    // negative scanario
    it('should return error message for validation', () => {
      cy.request({
        method: 'POST',
        url: '/auth/register',
        failOnStatusCode: false,
      }).then((response) => {
        // cara pertama untuk validasi, satu per satu menggunakan response
        // expect(response.status).to.eq(400)
        // expect(response.body.error).to.eq('Bad Request')
        // expect('name should not be empty').to.be.oneOf(response.body.message)
        // expect('email should not be empty').to.be.oneOf(response.body.message)
        // expect('password should not be empty').to.be.oneOf(response.body.message)

        // cara ke dua menggunakan global fuction
        cy.badRequest(response, [
          'name should not be empty',
          'email should not be empty',
          'password should not be empty'
        ])
      })
    })

    it('should return error message invalid email format', () => {
      cy.request({
        method: 'POST',
        url: '/auth/register',
        body: {
          name: userData.email,
          email: "john @ nest.test",
          password: userData.password
        },
        failOnStatusCode: false,
      }).then((response) => {
        // cara pertama untuk validasi, satu per satu menggunakan response
        // cy.log(response)
        // expect(response.status).to.eq(400)
        // expect(response.body.error).to.eq('Bad Request')
        // expect("email must be an email").to.be.oneOf(response.body.message)

        // cara ke dua menggunakan global fuction
        cy.badRequest(response, ["email must be an email"])
      })
    })

    it('should return error message invalid password format', () => {
      cy.request({
        method: 'POST',
        url: '/auth/register',
        body: {
          name: userData.name,
          email: userData.email,
          password: "invalidpassword"
        },
        failOnStatusCode: false,
      }).then((response) => {
        // langsung menggunakan global fuction
        cy.badRequest(response, ["password is not strong enough"])
      })
    })

    // positive scanario
    it('should successfully register', () => {
      cy.resetUsers()
      cy.request({
        method: 'POST',
        url: '/auth/register',
        body: userData,
      }).then((response) => {
        const {id, name, email, password} = response.body.data
        expect(response.status).to.eq(201)
        expect(response.body.success).to.be.true
        expect(id).not.to.be.undefined
        expect(name).to.eq("John Doe")
        expect(email).to.eq("john@nest.test")
        expect(password).to.be.undefined

      })
    })

    it('should return error because of duplicate email', () => {
      cy.request({
        method: 'POST',
        url: '/auth/register',
        body: userData,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(500)
        expect(response.body.success).to.be.false
        expect(response.body.message).to.eq("Email already exists")
      })
    })

  })

  describe('login', () => { 
    
    /**
     * 1. unregistered on failed
     * 2. return access token on success
    */

    // negative scanario
    it("should return unregistered on failed", () => {
      cy.request({
        method: 'POST',
        url: '/auth/login',
        failOnStatusCode: false,
      }).then((response) => {
        cy.unauthorized(response)
      })
      // wrong password
      cy.request({
        method: 'POST',
        url: '/auth/login',
        body: {
          email: userData.email,
          password: 'wrong password'
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.unauthorized(response)
      })
      // wrong email
      cy.request({
        method: 'POST',
        url: '/auth/login',
        body: {
          email: "john @ nest.test",
          password: userData.password
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.unauthorized(response)
      })
    })

    // positive scanario
    it('should return access token on success', () => {
      cy.request({
        method: 'POST',
        url: '/auth/login',
        body: {
          email: userData.email,
          password: userData.password
        },
      }).then((response) => {
        expect(response.body.success).to.be.true
        expect(response.body.message).to.eq("Login success")
        expect(response.body.data.access_token).not.to.be.undefined
      })
    })
  })

  describe('me', () => {
    
    /**
     * step:
     * 1. return unauthorized
     * 2. return correct data
     */

    before('do login', () => {
      cy.login()
    })

    it('should return unauthorized when send no token', () => {
      cy.checkUnauthorized('GET', '/auth/me')
    })

    it('should return correct current data', () => {
      cy.request({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`
        },
        failOnStatusCode: false,
      }).then((response) => {
        const {id, name, email, password} = response.body.data
        expect(response.status).to.eq(200)
        expect(response.body.success).to.be.true
        expect(id).not.to.be.undefined
        expect(name).to.eq(userData.name)
        expect(email).to.eq(userData.email)
        expect(password).to.be.undefined
      })
    })
  })
})