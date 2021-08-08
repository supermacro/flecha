import { useState, useEffect } from 'react'
import axios from 'axios'

import './App.css';
// import logo from './logo.svg';

export default function App() {
  const [ todos, setTodos ] = useState(null)

  useEffect(() => {
    axios.get('http://localhost:3000/todos')
      .then((response) => {
        setTodos(response.data.data)
      })

  }, [])

  return (
    <div className="App">
      <header className="App-header">
        Flecha Todos 
      </header>
      { todos
        ? todos.map(({ title }) => <div>{title}</div>)
        : <div>loading ...</div>
      }
      <div>Hello world</div>
    </div>
  );
}

