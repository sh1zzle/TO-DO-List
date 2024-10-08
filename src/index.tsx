import { useState, useEffect } from 'react';
import './style.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';

interface Todo {
  text: string;
  done: boolean;
}

const App = () => {
  const [todos, setToDos] = useState<Todo[]>(() => {
    const savedTodos = localStorage.getItem('todos');
    return savedTodos ? JSON.parse(savedTodos) : [];
  });
  const [input, setInput] = useState('');

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addToDo = () => {
    if (input.trim()) {
      setToDos([...todos, { text: input, done: false }]);
      setInput('');
    }
  };

  const removeTodo = (index: number) => {
    const newTodos = todos.filter((_, i) => i !== index);
    setToDos(newTodos);
  };

  const toggleDone = (index: number) => {
    const newTodos = todos.map((todo, i) =>
      i === index ? { ...todo, done: !todo.done } : todo
    );
    setToDos(newTodos);
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
        {todos.map((todo, index) => (
          <li
            key={index}
            className={`todo-item ${todo.done ? 'done' : ''}`}
            onClick={() => toggleDone(index)}
          >
            {todo.text}
            <FontAwesomeIcon
              onClick={(e) => {
                e.stopPropagation();
                removeTodo(index);
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
