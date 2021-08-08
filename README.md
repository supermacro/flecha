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
- [ ] CORS?
  - at the very least have a `OPTIONS` request
     This is known as a [preflight request](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request)
- [ ] Dependency injection
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
  - [ ] write to db
  - [ ] Authenticate
  - [ ] RBAC
     - Idea: Have super admin role and regular user role
       - Only super admins can delete todos
- [ ] Re-export zod parsers and tie to a specific version / tag
- [ ] Re-export neverthrow and tie to a specific version / tag
- [ ] Better error messages for parsing errors
    - Currently I'm just returning the raw Zod error



## Ideas:

- Partial type arguments one day: https://github.com/Microsoft/TypeScript/pull/26349
- Host on [fly.io](https://fly.io)


## Shoutout / Inspiration:

https://github.com/akheron/typera
