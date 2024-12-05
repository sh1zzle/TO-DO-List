import { useEffect, useState } from 'react';
import Select from 'react-select';
import './style.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrashCan,
  faArrowUp,
  faArrowDown,
  faPen,
  faFloppyDisk,
  faTimes,
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

enum SortOption {
  None = 'none',
  Alphabetical = 'alphabetical',
  ReverseAlphabetical = 'reverse-alphabetical',
}

enum StatusOptions {
  All = 'all',
  Done = 'done',
  Pending = 'pending',
}

const statusOptionsArray: { value: StatusOptions; label: string }[] = [
  { value: StatusOptions.All, label: 'All' },
  { value: StatusOptions.Done, label: 'Completed' },
  { value: StatusOptions.Pending, label: 'Pending' },
];

const App = () => {
  const todoManager = new TodoManager();
  const queryClient = useQueryClient();

  const [input, setInput] = useState<string>('');
  const [deletingTodoId, setDeletingTodoId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusOptions>(
    StatusOptions.All
  );
  const [sortOption, setSortOption] = useState<SortOption>(SortOption.None);
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

  const filteredTodos = previousTodos?.filter((todo) => {
    switch (statusFilter) {
      case StatusOptions.All:
        return true;
      case StatusOptions.Done:
        return todo.done;
      case StatusOptions.Pending:
        return !todo.done;
      default:
        throw new Error(`Unexpected statusFilter value: ${statusFilter}`);
    }
  });
  const sortedTodos = [...(filteredTodos ?? [])].sort((a, b) => {
    switch (sortOption) {
      case SortOption.Alphabetical:
        return a.text.localeCompare(b.text);
      case SortOption.ReverseAlphabetical:
        return b.text.localeCompare(a.text);
      case SortOption.None:
        return 0;
      default:
        console.error(`Unexpected sortOption value: ${sortOption}`);
        return 0;
    }
  });

  const toggleSortOrder = () => {
    if (sortOption === SortOption.Alphabetical) {
      setSortOption(SortOption.ReverseAlphabetical);
    } else {
      setSortOption(SortOption.Alphabetical);
    }
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
      if (context?.previousTodos) {
        queryClient.setQueryData(queryKey, context.previousTodos);
      }
      console.error('Error updating todo:', error);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },

    onSettled: () => {
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
            <Select
              value={statusOptionsArray.find(
                (option) => option.value === statusFilter
              )}
              onChange={(selectedOption) =>
                setStatusFilter(selectedOption?.value || StatusOptions.All)
              }
              options={statusOptionsArray}
              styles={{
                container: (provided) => ({
                  ...provided,
                  width: '140px',
                }),
                control: (provided, state) => ({
                  ...provided,
                  minHeight: '36px',
                  outline: 'none',
                  boxShadow: 'none',
                  borderColor: state.isFocused
                    ? '#d1d5db'
                    : provided.borderColor,
                  '&:hover': {
                    borderColor: '#d1d5db',
                  },
                }),
                menu: (provided) => ({
                  ...provided,
                  backgroundColor: '#f3f4f6',
                }),
                option: (provided, state) => ({
                  ...provided,
                  backgroundColor: state.isFocused ? '#e5e7eb' : '#f3f4f6',
                  color: state.isSelected ? '#000' : '#333',
                }),
              }}
            />
          </div>
          <div>
            <button
              onClick={toggleSortOrder}
              className="px-4 py-2 border rounded-md flex items-center justify-center  focus:ring-1 focus:ring-gray-300"
            >
              {sortOption === SortOption.Alphabetical ? (
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
                className={`bg-white flex justify-between items-center mb-[7px] px-8 py-[5px] rounded-lg mx-8 cursor-pointer ${
                  todo.done ? 'line-through text-gray-500' : ''
                }`}
                onClick={() => {
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
                  {editingTodoId === todo.id ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(todo.id)}
                        className="ml-[10px] cursor-pointer px-[9px] py-[5px] rounded-full bg-gray-200 hover:bg-green-500 transition-colors duration-200 text-gray-700 hover:text-white"
                      >
                        <FontAwesomeIcon icon={faFloppyDisk} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingTodoId(null);
                          setEditText('');
                        }}
                        className="ml-[10px] cursor-pointer px-[9px] py-[5px] rounded-full bg-gray-200 hover:bg-red-500 transition-colors duration-200 text-gray-700 hover:text-white"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center">
                      {deletingTodoId === todo.id ? (
                        <span className="text-red-500">Deleting...</span>
                      ) : (
                        <>
                          <FontAwesomeIcon
                            icon={faPen}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(todo);
                            }}
                            className="ml-[10px] cursor-pointer p-2 rounded-full bg-gray-200 hover:bg-yellow-500 transition-colors duration-200 text-gray-700 hover:text-white"
                          />

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
                        <span className="text-red-500">
                          Error removing todo
                        </span>
                      )}
                    </div>
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
