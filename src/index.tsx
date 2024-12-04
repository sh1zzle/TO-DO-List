import { useEffect, useState } from 'react';
import './style.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrashCan,
  faArrowUp,
  faArrowDown,
} from '@fortawesome/free-solid-svg-icons';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TodoManager from './todoManager';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

interface MutationContext {
  previousTodos?: Todo[];
}

const App = () => {
  const todoManager = new TodoManager();
  const queryClient = useQueryClient();

  const [input, setInput] = useState<string>('');
  const [deletingTodoId, setDeletingTodoId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('none'); // Sort option

  const handleAddTodo = () => {
    if (!input.trim()) return;
    addTodoMutation.mutate(input);
    setInput('');
  };

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
  }, [handleAddTodo]);

  const addTodoMutation = useMutation<Todo, Error, string, MutationContext>({
    mutationFn: (text: string) => todoManager.addTodo(text),

    onMutate: async (text: string) => {
      await queryClient.cancelQueries({ queryKey });

      const previousTodos = queryClient.getQueryData<Todo[]>(queryKey);

      const newTodo: Todo = {
        id: Date.now(),
        text,
        done: false,
      };

      queryClient.setQueryData<Todo[]>(queryKey, (oldTodos) => [
        ...(oldTodos || []),
        newTodo,
      ]);

      return { previousTodos };
    },

    onError: (error, text, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(queryKey, context.previousTodos);
      }
      console.error('Error adding todo:', error);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const queryKey = ['todos'];

  const {
    data: todos,
    isPending: isTodosLoading,
    isError: isTodosError,
    error: todosError,
  } = useQuery<Todo[]>({
    queryFn: () => todoManager.fetchTodos(),
    queryKey,
  });

  const toggleTodoMutation = useMutation<void, Error, number, MutationContext>({
    mutationFn: async (id: number) => {
      const todo = todos?.find((t) => t.id === id);
      console.log('todo: ', todo);
      if (todo) {
        await todoManager.updateTodo(id, !todo.done);
      }
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey });

      const previousTodos = queryClient.getQueryData<Todo[]>(queryKey);

      queryClient.setQueryData<Todo[]>(queryKey, (oldTodos) =>
        oldTodos?.map((todo) =>
          todo.id === id ? { ...todo, done: !todo.done } : todo
        )
      );

      return { previousTodos };
    },
    onError: (error, id, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(queryKey, context.previousTodos);
      }
      console.error('Error toggling todo:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const removeTodoMutation = useMutation<void, Error, number, MutationContext>({
    mutationFn: async (id: number) => {
      await todoManager.removeTodo(id);
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey });

      const previousTodos = queryClient.getQueryData<Todo[]>(queryKey);

      queryClient.setQueryData<Todo[]>(queryKey, (oldTodos) =>
        oldTodos?.filter((todo) => todo.id !== id)
      );

      return { previousTodos };
    },
    onError: (error, id, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(queryKey, context.previousTodos);
      }
      console.error('Error removing todo:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const previousTodos = queryClient.getQueryData<Todo[]>(queryKey);
  console.log('previousTodos: ', previousTodos);

  const filteredTodos = previousTodos?.filter((todo) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'done') return todo.done;
    if (statusFilter === 'pending') return !todo.done;

    return false;
  });

  const sortedTodos = filteredTodos?.sort((a, b) => {
    if (sortOption === 'alphabetical') {
      return a.text.localeCompare(b.text); // A-Z
    } else if (sortOption === 'reverse-alphabetical') {
      return b.text.localeCompare(a.text); // Z-A
    }
    return 0;
  });

  const toggleSortOrder = () => {
    setSortOption((prev) =>
      prev === 'alphabetical' ? 'reverse-alphabetical' : 'alphabetical'
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
          onClick={handleAddTodo}
          className={`px-5 py-2.5 text-white border-none rounded-[5px] cursor-pointer text-base transition-colors duration-200 ${
            input.length > 0 ? 'bg-[#0056b3]' : 'bg-gray-300'
          }`}
          disabled={isTodosLoading || input.length === 0}
        >
          Add
        </button>
      </div>

      {isTodosError && (
        <div className="text-red-500 mb-3">
          Error loading todos: {todosError?.message}
        </div>
      )}

      <div className="flex justify-between items-center px-[30px]">
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-10 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
          >
            <option value="all">All</option>
            <option value="done">Completed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div>
          <button
            onClick={toggleSortOrder}
            className="px-4 py-2 border rounded-md flex items-center justify-center  focus:ring-1 focus:ring-gray-300"
          >
            {sortOption === 'alphabetical' ? (
              <>
                <FontAwesomeIcon icon={faArrowUp} />
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faArrowDown} />
              </>
            )}
          </button>
        </div>
      </div>

      {isTodosLoading ? (
        <div>Loading todos...</div>
      ) : (
        <ul>
          {sortedTodos?.map((todo) => (
            <li
              key={todo.id}
              className={`flex justify-between items-center px-8 pt-[10px] cursor-pointer ${
                todo.done ? 'line-through text-gray-500' : ''
              }`}
              onClick={() => {
                toggleTodoMutation.mutate(todo.id);
              }}
            >
              {todo.text}
              <div className="flex items-center">
                {deletingTodoId === todo.id ? (
                  <span className="text-red-500">Deleting...</span>
                ) : (
                  <FontAwesomeIcon
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        !removeTodoMutation.isPending &&
                        sortedTodos.some((t) => t.id === todo.id)
                      ) {
                        setDeletingTodoId(todo.id);
                        removeTodoMutation.mutate(todo.id, {
                          onSettled: () => {
                            setDeletingTodoId(null);
                          },
                        });
                      }
                    }}
                    icon={faTrashCan}
                    className="ml-[10px] cursor-pointer p-2 rounded-full bg-gray-200 hover:bg-red-500 transition-colors duration-200 text-gray-700 hover:text-white"
                  />
                )}
                {removeTodoMutation.isError && (
                  <span className="text-red-500">Error removing todo</span>
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
