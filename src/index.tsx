import { useEffect, useState } from 'react';
import './style.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';

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

      console.log('previousTodos: ', previousTodos);

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
          {addTodoMutation.isPending ? 'Adding' : 'Add'}
        </button>
      </div>

      {isTodosError && (
        <div className="text-red-500 mb-3">
          Error loading todos: {todosError?.message}
        </div>
      )}

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
                        todos.some((t) => t.id === todo.id)
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
                    className={`ml-[10px] cursor-pointer p-2 rounded-full bg-gray-200 hover:bg-red-500 transition-colors duration-200 text-gray-700 hover:text-white ${
                      removeTodoMutation.isPending ||
                      deletingTodoId === todo.id ||
                      !todos.length ||
                      !todos.some((t) => t.id === todo.id)
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
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
