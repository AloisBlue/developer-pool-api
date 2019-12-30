import request from "supertest";
import { expect } from "chai";
import server from "../index";
import User from "../models/User";

let Server;

describe('/api/users', () => {
  beforeEach(() => { Server = server })
  afterEach(() => Server.close());
  afterEach(() => User.deleteMany({}));

  describe('POST /signup', () => {

    it('should check for empty fields', (done) => {
      request(Server)
        .post('/api/users/signup')
        .send({  registerUser: {} })
        .end((err, res) => {
          if (err) {
            throw err;
          }
          expect(res.statusCode).to.equal(400);
          expect(res.body.errors).to.include.all.keys('firstName', 'lastName', 'userName', 'email', 'password', 'confirmPassword')
          expect(res.body.errors).to.deep.include({
            firstName: 'First name field is required',
            lastName: 'Last name field is required',
            userName: 'User name field is required',
            email: 'Email field is required',
            password: 'Password field is required',
            confirmPassword: 'Confirm password field is required'
          });
          done();
        });
    });

    it('should check for maximum characters in inputs', (done) => {
      const testArray = new Array(23).join('n');

      request(Server)
        .post('/api/users/signup')
        .send({ registerUser: {
          firstName: testArray,
          lastName: testArray,
          userName: testArray,
          email: 'alex@gmail.com',
          password: 'wangeCHIALOis2@',
          confirmPassword: 'wangeCHIALOis2@'
        }})
        .end((err, res) => {
          expect(res.statusCode).to.equal(400);
          expect(res.body.errors).to.include.all.keys('firstName', 'lastName', 'userName');
          expect(res.body.errors).to.deep.include({
            firstName: 'First name must be between 1 and 20 characters',
            lastName: 'Last name must be between 1 and 20 characters',
            userName: 'User name must be between 1 and 20 characters'
          });
          done();
        });
    });

    it('should check if the email is valid', (done) => {
      request(Server)
        .post('/api/users/signup')
        .send({ registerUser: {
          firstName: 'Alois',
          lastName: 'Mburu',
          userName: 'Blue',
          email: 'invalidemail',
          password: 'wangeCHIALOis2@',
          confirmPassword: 'wangeCHIALOis2@'
        }})
        .end((err, res) => {
          if (err) {
            throw err;
          }
          expect(res.statusCode).to.equal(400);
          expect(res.body.errors).to.have.property('email');
          expect(res.body.errors).to.deep.include({
            email: 'Email is invalid'
          });
          done();
        });
    });

    it('should check password strength', (done) => {
      request(Server)
        .post('/api/users/signup')
        .send({ registerUser: {
          firstName: 'Alois',
          lastName: 'Mburu',
          userName: 'Blue',
          email: 'developer@gmail.com',
          password: 'weak',
          confirmPassword: 'weak'
        }})
        .end((err, res) => {
          if (err) {
            throw err;
          }
          expect(res.statusCode).to.equal(400);
          expect(res.body.errors).to.have.property('password');
          expect(res.body.errors).to.deep.include({
            password: 'A good password should contain uppercase, lowercase, special characters @#$%&^+=! , digits and above 8 characters'
          })
          done();
        });
    });

    it('should check password matches', (done) => {
      request(Server)
        .post('/api/users/signup')
        .send({ registerUser: {
          firstName: 'Alois',
          lastName: 'Mburu',
          userName: 'Blue',
          email: 'developer@gmail.com',
          password: 'dEvelop@r1',
          confirmPassword: 'unmatched'
        } })
        .end((err, res) => {
          if (err) {
            throw err;
          }
          expect(res.statusCode).to.equal(400);
          expect(res.body.errors).to.have.property('confirmPassword');
          expect(res.body.errors).to.deep.include({
            confirmPassword: 'Passwords must match!!!'
          });
          done();
        });
    });

    it('should check if user exists', (done) => {
      // create new user first
      const user = new User({
        firstName: 'Alois',
        lastName: 'Mburu',
        userName: 'Blue',
        email: 'developer@gmail.com',
        password: 'dEvelop@r1',
        confirmPassword: 'dEvelop@r1'
      })
      user.save();

      request(Server)
        .post('/api/users/signup')
        .send({ registerUser: {
          firstName: 'Alois',
          lastName: 'Mburu',
          userName: 'Blue',
          email: 'developer@gmail.com',
          password: 'dEvelop@r1',
          confirmPassword: 'dEvelop@r1'
        }})
        .end((err, res) => {
          if (err) {
            throw err;
          }
          expect(res.statusCode).to.equal(409);
          expect(res.body.errors).to.have.property('global');
          expect(res.body.errors).to.deep.include({
            global: 'Email already exists'
          })
          done();
        });
    });

    it('should check if the user name is unique', (done) => {
      // create a user first
      const user = new User({
        firstName: 'Alois',
        lastName: 'Mburu',
        userName: 'Blue',
        email: 'developer@gmail.com',
        password: 'dEvelop@r1',
        confirmPassword: 'dEvelop@r1'
      })
      user.save();

      request(Server)
        .post('/api/users/signup')
        .send({ registerUser: {
          firstName: 'Alois',
          lastName: 'Mburu',
          userName: 'Blue',
          email: 'developer1@gmail.com',
          password: 'dEvelop@r1',
          confirmPassword: 'dEvelop@r1'
        }})
        .end((err, res) => {
          if (err) {
            throw err;
          }
          expect(res.statusCode).to.equal(409);
          expect(res.body.errors).to.have.property('userName');
          expect(res.body.errors).to.deep.include({
            userName: 'User name already taken'
          });
          done();
        })
    });

    it('should create a new user', (done) => {
      request(Server)
        .post('/api/users/signup')
        .send({ registerUser: {
          firstName: 'Alois',
          lastName: 'Mburu',
          userName: 'Blue',
          email: 'developer@gmail.com',
          password: 'dEvelop@r1',
          confirmPassword: 'dEvelop@r1'
        } })
        .end((err, res) => {
          if (err) {
            throw err;
          }
          expect(res.statusCode).to.equal(201);
          expect(res.body).to.deep.include.all.keys('status', 'message', 'userCreated');
          expect(res.body).to.include({
            status: '201',
            message: 'You have successfully signed up'
          });
          expect(res.body.userCreated).to.be.a('object');
          expect(res.body.userCreated).to.deep.include.all.keys('firstName', 'lastName', 'userName', 'email');
          done();
        });
    });

  });

  describe('POST /login', () => {

    it('should check for empty fields', (done) => {
      request(Server)
        .post('/api/users/login')
        .send({ credentials: {} })
        .end((err, res) => {
          if (err) {
            throw err;
          }
          expect(res.statusCode).to.equal(400);
          expect(res.body.errors).to.deep.include.all.keys('email', 'password');
          expect(res.body.errors).to.deep.include({
            email: 'Email field is required',
            password: 'Password field is required'
          })
          done();
        });
    });

    it('should check if the email is valid', (done) => {
      request(Server)
        .post('/api/users/login')
        .send({ credentials: {
            email: "g.com",
            password: 'dEvelop@r1'
        }})
        .end((err, res) => {
          if (err) {
            throw err;
          }
          expect(res.statusCode).to.equal(400);
          expect(res.body.errors).to.have.property('email');
          expect(res.body.errors).to.deep.include({
            email: 'Email is invalid'
          })
          done();
        })
    });

    it('should check if user exists', (done) => {
      request(Server)
        .post('/api/users/login')
        .send({ credentials: {
            email: 'developer@gmail.com',
            password: 'dEvelop@r1'
        }})
        .end((err, res) => {
          if (err) {
            throw err;
          }
          expect(res.statusCode).to.equal(401);
          expect(res.body.errors).to.have.property('global');
          expect(res.body.errors).to.deep.include({
            global: 'Failed to log in. Confirm email and password'
          });
          done();
        });
    });

    it('should check if password is correct', (done) => {
      // signup request first
      request(Server)
        .post('/api/users/signup')
        .send({ registerUser: {
          firstName: 'Alois',
          lastName: 'Mburu',
          userName: 'Blue',
          email: 'developer@gmail.com',
          password: 'dEvelop@r1',
          confirmPassword: 'dEvelop@r1'
        }})
        .end((err) => {
          if (err) {
            throw err;
          }
          // login request
          request(Server)
            .post('/api/users/login')
            .send({ credentials: {
              email: 'developer@gmail.com',
              password: 'wrongpass'
            }})
            .end((error, response) => {
              if (error) {
                throw error;
              }
              expect(response.statusCode).to.equal(401);
              expect(response.body.errors).to.have.property('global');
              expect(response.body.errors).to.deep.include({
                global: 'Invalid credentials'
              });
              done();
            });
        });
    });

    it('should check that hashes are unique even on identical strings', (done) => {
      // create user in DB first
      const user = new User({
        firstName: 'Alois',
        lastName: 'Mburu',
        userName: 'Blue',
        email: 'developer@gmail.com',
        password: 'dEvelop@r1',
        confirmPassword: 'dEvelop@r1'
      })
      user.save();

      request(Server)
        .post('/api/users/login')
        .send({ credentials: {
          email: 'developer@gmail.com',
          password: 'dEvelop@r1'
        }})
        .end((err, res) => {
          if (err) {
            throw err;
          }
          expect(res.statusCode).to.equal(401);
          expect(res.body.errors).to.have.property('global');
          expect(res.body.errors).to.deep.include({
            global: 'Invalid credentials'
          });
          done();
        });
    });

    it('should check the system logs in', (done) => {
      // signup request
      request(Server)
        .post('/api/users/signup')
        .send({ registerUser: {
          firstName: 'Alois',
          lastName: 'Mburu',
          userName: 'Blue',
          email: 'developer@gmail.com',
          password: 'dEvelop@r1',
          confirmPassword: 'dEvelop@r1'
        }})
        .end((err) => {
          if (err) {
            throw err;
          }
          request(Server)
            .post('/api/users/login')
            .send({ credentials: {
              email: 'developer@gmail.com',
              password: 'dEvelop@r1'
            }})
            .end((error, response) => {
              expect(response.statusCode).to.equal(200);
              done();
            });
        });
    });

    // it('should check if user exists', (done) => {
    //   request(Server)
    //     .post('/api/users/login')
    //     .send()
    //     .end((err, res) => {
    //       done();
    //     });
    // });

  });
});
