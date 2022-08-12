"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var typescript_1 = __importDefault(require("typescript"));
var path_1 = __importDefault(require("path"));
var isVariableStatement = function (statement) {
    return statement.kind === typescript_1["default"].SyntaxKind.VariableStatement;
};
var TODO_APP_PATH = 'examples/todo-app/server/index.ts';
var flechaAppPath = path_1["default"].resolve(process.cwd(), TODO_APP_PATH);
var program = typescript_1["default"].createProgram([flechaAppPath], {});
var sourceFiles = program.getSourceFiles();
sourceFiles.forEach(function (file) {
    if (file.fileName.includes('node_modules'))
        return;
    console.log(file);
    file.statements.forEach(function (statement) {
        if (isVariableStatement(statement)) {
            console.log(statement.declarationList);
        }
    });
});
