import { useEffect } from 'react';
import './style.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';

import { useTodo } from './useTodo';

const App = () => {
  const {
    todos,
    addTodo,
    removeTodo,
    toggleDone,
    input,
    setInput,
    getTodos,
    loading,
  } = useTodo();

  useEffect(() => {
    const loadTodos = async () => {
      try {
        await getTodos();
      } catch (error) {
        console.error('Error loading todos:', error);
      }
    };

    loadTodos();
  }, []);

  const handleAddTodo = async () => {
    if (!input.trim()) return;
    try {
      await addTodo(input);
      setInput('');
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  return (
    <div className="max-w-[500px] mx-auto my-12 p-5 bg-gray-100 rounded-lg shadow-lg text-center font-sans">
      <h1 className="font-bold mb-5 text-3xl text-teal-700">My To-Do List</h1>
      <div className="flex justify-center mb-5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a new task"
          className="p-[10px] text-base rounded-[5px] border border-gray-300 w-[70%] mr-[10px] outline-none transition-colors duration-200 focus:border-blue-500"
          disabled={loading}
        />
        <button
          onClick={handleAddTodo}
          className="px-5 py-2.5 bg-[#81abda] text-white border-none rounded-[5px] cursor-pointer text-base transition-colors duration-200 hover:bg-[#0056b3]"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add'}
        </button>
      </div>
      <ul className="list-none p-0 flex flex-col">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className={`flex justify-between items-center pl-[50px] pr-[50px] pt-[10px] cursor-pointer ${
              todo.done ? 'line-through text-gray-500' : ''
            }`}
            onClick={() => toggleDone(todo.id)}
          >
            {todo.text}
            <FontAwesomeIcon
              onClick={(e) => {
                e.stopPropagation();
                removeTodo(todo.id);
              }}
              icon={faTrashCan}
              className="ml-[10px] cursor-pointer"
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
