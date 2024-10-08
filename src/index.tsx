import { useState, useEffect } from 'react';
import './style.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';

const App = () => {
  const [todos, setToDos] = useState<string[]>(() => {
    const savedTodos = localStorage.getItem('todos');
    return savedTodos ? JSON.parse(savedTodos) : [];
  });
  const [input, setInput] = useState('');

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addToDo = () => {
    if (input.trim()) {
      setToDos([...todos, input]);
      setInput('');
    }
  };

  const removeTodo = (index: number) => {
    const newTodos = todos.filter((_, i) => i !== index);
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
          <li key={index} className='todo-item'>
            {todo}
            <FontAwesomeIcon
              onClick={() => removeTodo(index)}
              icon={faTrashCan}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
