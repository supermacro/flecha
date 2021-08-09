# Flecha 🏹

> Opinionated, functional and typesafe ✨ HTTP server


**This is a work in progress**.


## Features

### JSON only

v1 of Flecha focus only on JSON requests and responses. 

Future versions of Flecha *may* allow for handling other sorts of input and output data.


### Litmus Test


The road to 1.0


- [x] JSON decoding
- [ ] Decent level of tests
- [ ] Handle `PATCH` request
- [ ] Dependency injection
  - Given an object of dependencies, have those dependencies available to request handlers
    things such as a `db` object containing a stateful database connection
- [ ] Middleware
- [ ] Built-In Parsers
  - [x] - Ability to parse url paths
  - [ ] - Ability to parse query params 
- [ ] Plug into existing expressjs application
- [ ] TODO app
  - [ ] `GET` many todos
    - [ ] Implement pagination using query params
  - [ ] `GET` one todo
  - [ ] `PUT` todo
  - [ ] `POST` todo
  - [ ] `DELETE` todo
  - [x] write to db
- [ ] Re-export zod parsers and tie to a specific version / tag
- [ ] Re-export neverthrow and tie to a specific version / tag
- [ ] Better error messages for parsing errors
    - Currently I'm just returning the raw Zod error



## Ideas:

- Partial type arguments one day: https://github.com/Microsoft/TypeScript/pull/26349
- Host on [fly.io](https://fly.io)


## Shoutout / Inspiration:

https://github.com/akheron/typera
