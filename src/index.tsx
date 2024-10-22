import { useEffect } from 'react';
import './style.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';

import { useTodo } from './useTodo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const App = () => {
  const { addTodo, removeTodo, toggleDone, getTodos, input, setInput } =
    useTodo();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleAddTodo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [input]);

  const addTodoMutation = useMutation({
    mutationFn: (text: string) => addTodo(text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
    onError: (error) => {
      console.error('Error adding todo:', error);
    },
  });

  const handleAddTodo = () => {
    if (!input.trim()) return;
    addTodoMutation.mutate(input);
    setInput('');
  };

  const { data: todos, isLoading: isTodosLoading } = useQuery({
    queryFn: () => getTodos(),
    queryKey: ['todos'],
  });

  console.log('isTodosLoading: ', isTodosLoading);

  const removeTodoMutation = useMutation({
    mutationFn: (id: number) => {
      return removeTodo(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const toggleTodoMutation = useMutation({
    mutationFn: (id: number) => {
      return toggleDone(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

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
          disabled={isTodosLoading}
        />
        <button
          onClick={handleAddTodo}
          className={`px-5 py-2.5 text-white border-none rounded-[5px] cursor-pointer text-base transition-colors duration-200 ${
            input.length > 0 ? 'bg-[#0056b3]' : 'bg-gray-300'
          }`}
          disabled={isTodosLoading || input.length === 0}
        >
          {isTodosLoading === true ? 'Add' : 'Adding...'}
        </button>
      </div>

      {isTodosLoading ? (
        <div>Loading todos...</div>
      ) : (
        <ul className="list-none p-0 flex flex-col">
          {todos?.map((todo) => (
            <li
              key={todo.id}
              className={`flex justify-between items-center pl-[50px] pr-[50px] pt-[10px] cursor-pointer ${
                todo.done ? 'line-through text-gray-500' : ''
              }`}
              onClick={() => toggleTodoMutation.mutate(todo.id)}
            >
              {todo.text}
              <FontAwesomeIcon
                onClick={(e) => {
                  e.stopPropagation();
                  removeTodoMutation.mutate(todo.id);
                }}
                icon={faTrashCan}
                className="ml-[10px] cursor-pointer p-2 rounded-full bg-gray-200 hover:bg-red-500 transition-colors duration-200 text-gray-700 hover:text-white"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default App;
