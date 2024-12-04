import { useEffect, useState } from 'react';
import './style.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrashCan,
  faArrowUp,
  faArrowDown,
  faPen,
  faFloppyDisk,
} from '@fortawesome/free-solid-svg-icons';
import { faSquare, faCheckSquare } from '@fortawesome/free-regular-svg-icons';

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
  const [sortOption, setSortOption] = useState('none');
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);

  const [editText, setEditText] = useState('');

  const handleEdit = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditText(todo.text);
  };

  const handleSaveEdit = (todoId: number) => {
    const previousTodos = queryClient.getQueryData<Todo[]>(queryKey);
    const todoToUpdate = previousTodos?.find((todo) => todo.id === todoId);

    if (todoToUpdate) {
      const updatedTodo = { ...todoToUpdate, text: editText };

      updateTodoMutation.mutate(updatedTodo);

      setEditingTodoId(null);
      setEditText('');
    }
  };

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

  const updateTodoMutation = useMutation<Todo, Error, Todo, MutationContext>({
    mutationFn: (updatedTodo: Todo) => todoManager.editTodo(updatedTodo),
    onMutate: async (updatedTodo: Todo) => {
      await queryClient.cancelQueries({ queryKey });

      const previousTodos = queryClient.getQueryData<Todo[]>(queryKey);

      queryClient.setQueryData<Todo[]>(queryKey, (oldTodos) => {
        return oldTodos?.map((todo) =>
          todo.id === updatedTodo.id ? { ...todo, ...updatedTodo } : todo
        );
      });

      return { previousTodos };
    },

    onError: (error, updatedTodo, context) => {
      // If there was an error, revert the todos to their previous state
      if (context?.previousTodos) {
        queryClient.setQueryData(queryKey, context.previousTodos);
      }
      console.error('Error updating todo:', error);
    },

    onSuccess: () => {
      // Invalidate the queries so they refetch the latest data
      queryClient.invalidateQueries({ queryKey });
    },

    onSettled: () => {
      // Invalidate queries on both success and error to ensure the cache is fresh
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return (
    <div className="max-w-[800px] mx-auto my-12 p-5 bg-gray-100 rounded-lg shadow-lg text-center font-sans">
      <h1 className="font-bold mb-5 text-3xl text-teal-700">My To-Do List</h1>

      <div className="flex justify-between items-center mb-5 px-8">
        <div className="w-[70%] flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a new task"
            className="p-[10px] text-base rounded-[5px] border border-gray-300 mr-[10px] outline-none transition-colors duration-200 focus:border-blue-500 w-[70%]"
          />
          <button
            onClick={handleAddTodo}
            className={`w-[20%] px-5 py-2.5 text-white border-none rounded-[5px] cursor-pointer text-base transition-colors duration-200 ${
              input.length > 0 ? 'bg-[#0056b3]' : 'bg-gray-300'
            }`}
            disabled={isTodosLoading || input.length === 0}
          >
            Add
          </button>
        </div>

        <div className="flex gap-2 justify-end items-center w-[30%]">
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
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
      </div>

      {isTodosError && (
        <div className="text-red-500 mb-3">
          Error loading todos: {todosError?.message}
        </div>
      )}

      {isTodosLoading ? (
        <div>Loading todos...</div>
      ) : (
        <ul>
          {sortedTodos?.map((todo) => (
            <div>
              <li
                key={todo.id}
                className={`bg-white flex justify-between items-center mb-4 px-8 py-4 rounded-lg mx-8 cursor-pointer ${
                  todo.done ? 'line-through text-gray-500' : ''
                }`}
                onClick={(e) => {
                  // Prevent toggle when editing
                  if (editingTodoId !== todo.id) {
                    toggleTodoMutation.mutate(todo.id);
                  }
                }}
              >
                <div>
                  <FontAwesomeIcon
                    icon={todo.done ? faCheckSquare : faSquare}
                    className="mr-4 cursor-pointer bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTodoMutation.mutate(todo.id);
                    }}
                  />

                  {editingTodoId === todo.id ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="px-4 py-2 border rounded-md"
                    />
                  ) : (
                    <span>{todo.text}</span>
                  )}
                </div>

                <div className="flex items-center">
                  {deletingTodoId === todo.id ? (
                    <span className="text-red-500">Deleting...</span>
                  ) : (
                    <>
                      {/* Edit Button */}
                      <FontAwesomeIcon
                        icon={faPen}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(todo); // Trigger editing
                        }}
                        className="ml-[10px] cursor-pointer p-2 rounded-full bg-gray-200 hover:bg-yellow-500 transition-colors duration-200 text-gray-700 hover:text-white"
                      />

                      {/* Delete Button */}
                      <FontAwesomeIcon
                        icon={faTrashCan}
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
                        className="ml-[10px] cursor-pointer p-2 rounded-full bg-gray-200 hover:bg-red-500 transition-colors duration-200 text-gray-700 hover:text-white"
                      />
                    </>
                  )}

                  {removeTodoMutation.isError && (
                    <span className="text-red-500">Error removing todo</span>
                  )}

                  {editingTodoId === todo.id && (
                    <button
                      onClick={() => handleSaveEdit(todo.id)}
                      className="ml-[10px] cursor-pointer px-[9px] py-[5px] rounded-full bg-gray-200 hover:bg-green-500 transition-colors duration-200 text-gray-700 hover:text-white"
                    >
                      <FontAwesomeIcon icon={faFloppyDisk} />
                    </button>
                  )}
                </div>
              </li>
            </div>
          ))}
        </ul>
      )}
    </div>
  );
};

export default App;
