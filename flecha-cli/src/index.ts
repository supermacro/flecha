import ts from 'typescript'
import type { Statement, VariableStatement } from 'typescript'
import path from 'path'

const isVariableStatement = (statement: Statement): statement is VariableStatement =>
  statement.kind === ts.SyntaxKind.VariableStatement

const TODO_APP_PATH = 'examples/todo-app/server/index.ts'

const flechaAppPath = path.resolve(process.cwd(), TODO_APP_PATH)

const program = ts.createProgram([ flechaAppPath ], {})

const sourceFiles = program.getSourceFiles()

sourceFiles.forEach((file) => {
  if (file.fileName.includes('node_modules')) return

  console.log(file)

  file.statements.forEach((statement) => {
    if (isVariableStatement(statement)) {
      console.log(statement.declarationList)
    }
  })
})

