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
    <div className="max-w-[500px] mx-auto my-12 p-5 bg-gray-100 rounded-lg shadow-lg text-center font-sans">
      <h1 className="font-bold mb-5 text-3xl text-teal-700">My To-Do List</h1>
      <div className="flex justify-center mb-5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a new task"
          className="p-[10px] text-base rounded-[5px] border border-gray-300 w-[70%] mr-[10px] outline-none transition-colors duration-200 focus:border-blue-500"
        />
        <button
          onClick={addToDo}
          className="px-5 py-2.5 bg-[#81abda] text-white border-none rounded-[5px] cursor-pointer text-base transition-colors duration-200 hover:bg-[#0056b3]"
        >
          Add
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
