import request from "supertest";
import  { expect } from "chai";
import server from "../index";
import User from "../models/User";
import Question from "../models/Question";


describe('/api/questions', () => {
  let Server;

  beforeEach(() => { Server = server });
  afterEach(() => Server.close());
  afterEach(() => {
    Question.deleteMany({});
    User.deleteMany({});
  });

  describe('POST /questions', () => {

    it('should check for empty fields', (done) => {
      // generate token
      const token = new User().generateAuthToken();

      request(Server)
        .post('/api/questions/question')
        .set('Authorization' ,token)
        .send({ addQuestion: {}})
        .end((err, res) => {
          if (err) {
            throw err;
          }
          expect(res.statusCode).to.equal(400);
          expect(res.body.errors).to.have.property('question');
          expect(res.body.errors).to.deep.include({
            question: 'Question field is required'
          });
          done();
        })
    });

    it('should check for the minimum characters', (done) => {
      // generate token
      const token = new User().generateAuthToken();

      request(Server)
        .post('/api/questions/question')
        .set('Authorization', token)
        .send({ addQuestion: {
          // less than three character(s)
          question: 'Mg'
        }})
        .end((err, res) => {
          if (err) {
            throw err;
          }
          expect(res.statusCode).to.equal(400);
          expect(res.body.errors).to.have.property('question');
          expect(res.body.errors).to.deep.include({
            question: 'The minimum character expected is 3 while maximum is 255'
          });
          done();
        })
    });

    it('should check for the maximum characters', (done) => {
      // generate token
      const token = new User().generateAuthToken();
      // generate more than 255 characters
      const testArray = new Array(260).join('a');

      request(Server)
        .post('/api/questions/question')
        .set('Authorization', token)
        .send({ addQuestion: {
          question: testArray
        }})
        .end((err, res) => {
          if (err) {
            throw err;
          }
          expect(res.statusCode).to.equal(400);
          expect(res.body.errors).to.have.property('question');
          expect(res.body.errors).to.deep.include({
            question: 'The minimum character expected is 3 while maximum is 255'
          });
          done();
        });
    });



    it('should check if the question already exists', (done) => {
      // create new question
      // const question = new Question({
      //   question: 'This is my testing phrase'
      // });
      // question.save();

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
        .end((newErr) => {
          if (newErr) {
            throw newErr;
          }
          // login request
          request(Server)
            .post('/api/users/login')
            .send({ credentials: {
              email: 'developer@gmail.com',
              password: 'dEvelop@r1'
            }})
            .end((error, response) => {
              if (error) {
                throw error;
              }
              // create question that already exists
              request(Server)
                .post('/api/questions/question')
                .set('Authorization', response.body.token)
                .send({ addQuestion: {
                  question: 'This is my testing phrase'
                }})
                .end((err, res) => {
                  if (err) {
                    throw err;
                  }
                  expect(res.statusCode).to.equal(409);
                  done();
            });
        });
    });
  })

  });
});
