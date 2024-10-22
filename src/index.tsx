import { useEffect, useState } from 'react';
import './style.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';

import { useTodo } from './useTodo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

const App = () => {
  const { addTodo, removeTodo, toggleDone, getTodos, input, setInput } =
    useTodo();
  const queryClient = useQueryClient();

  const [removeLoading, setRemoveLoading] = useState(false);

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

  const addTodoMutation = useMutation<Todo, Error, string>({
    mutationFn: addTodo,
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

  const { data: todos, isPending: isTodosLoading } = useQuery({
    queryFn: () => getTodos(),
    queryKey: ['todos'],
  });

  const toggleTodoMutation = useMutation<void, Error, number>({
    mutationFn: (id) => toggleDone(id), // Assuming toggleDone is updated to return void
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
    onError: (error) => {
      console.error('Error toggling todo:', error);
    },
  });

  const removeTodoMutation = useMutation<void, Error, number>({
    mutationFn: (id) => removeTodo(id), // Call the updated removeTodo function
    onMutate: () => {
      setRemoveLoading(true); // Set remove loading to true
      setTimeout(() => {
        setRemoveLoading(false); // Clear loading state after 3 seconds
      }, 3000);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] }); // Invalidate to refetch
    },
    onError: (error) => {
      console.error('Error removing todo:', error);
      setRemoveLoading(false); // Clear loading state on error
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
          disabled={addTodoMutation.isPending}
        />
        <button
          onClick={handleAddTodo}
          className={`px-5 py-2.5 text-white border-none rounded-[5px] cursor-pointer text-base transition-colors duration-200 ${
            input.length > 0 ? 'bg-[#0056b3]' : 'bg-gray-300'
          }`}
          disabled={isTodosLoading || input.length === 0}
        >
          {addTodoMutation.isPending === true ? 'Adding' : 'Add'}
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
              onClick={() => {
                toggleTodoMutation.mutate(todo.id); // Use toggle mutation
              }}
            >
              {todo.text}
              <div className="flex items-center">
                {removeLoading ? (
                  <span className="text-red-500">Deleting...</span>
                ) : (
                  <FontAwesomeIcon
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTodoMutation.mutate(todo.id); // Use remove mutation
                    }}
                    icon={faTrashCan}
                    className="ml-[10px] cursor-pointer p-2 rounded-full bg-gray-200 hover:bg-red-500 transition-colors duration-200 text-gray-700 hover:text-white"
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default App;
