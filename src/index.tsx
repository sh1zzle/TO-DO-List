import { useState, useEffect } from 'react';
import './style.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

const App = () => {
  const [todos, setToDos] = useState<Todo[]>(() => {
    const savedTodos = localStorage.getItem('todos');
    return savedTodos ? JSON.parse(savedTodos) : [];
  });
  const [input, setInput] = useState('');
  const [nextID, setNextID] = useState<number>(() => {
    const savedTodos = localStorage.getItem('todos');
    const parsedTodos = savedTodos ? JSON.parse(savedTodos) : [];
    const maxID =
      parsedTodos.length > 0
        ? Math.max(...parsedTodos.map((todo: Todo) => todo.id))
        : 0;
    return maxID + 1;
  });

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addToDo = () => {
    if (input.trim()) {
      setToDos((prevTodos) => [
        ...prevTodos,
        { id: nextID, text: input, done: false },
      ]);
      setInput('');
      setNextID((prev) => prev + 1);
    }
  };

  const removeTodo = (id: number) => {
    setToDos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
  };

  const toggleDone = (id: number) => {
    setToDos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      )
    );
  };

  return (
    <div className='app'>
      <h1>My To-Do List</h1>
      <div className='input-section'>
        <input
          type='text'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Enter a new task'
          className='input-field'
        />
        <button onClick={addToDo} className='add-button'>
          Add
        </button>
      </div>
      <ul className='todo-list'>
        {todos.map((todo) => (
          <li
            key={todo.id}
            className={`todo-item ${todo.done ? 'done' : ''}`}
            onClick={() => toggleDone(todo.id)}
          >
            {todo.text}
            <FontAwesomeIcon
              onClick={(e) => {
                e.stopPropagation();
                removeTodo(todo.id);
              }}
              icon={faTrashCan}
              className='delete-icon'
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
