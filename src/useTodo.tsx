import { useState, useEffect } from 'react';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

export const useTodo = () => {
  const [input, setInput] = useState<string>('');
  const [todos, setToDos] = useState<Todo[]>(() => {
    const savedTodos = localStorage.getItem('todos');
    return savedTodos ? JSON.parse(savedTodos) : [];
  });

  const [nextID, setNextID] = useState<number>(() => {
    const savedTodos = localStorage.getItem('todos');
    const parsedTodos = savedTodos ? JSON.parse(savedTodos) : [];
    const maxID =
      parsedTodos.length > 0
        ? Math.max(...parsedTodos.map((todo: Todo) => todo.id))
        : 0;
    return maxID + 1;
  });

  const sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  // Save todos to localStorage when they change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const getTodos = async (): Promise<Todo[]> => {
    await sleep(1000);
    const storedTodos = localStorage.getItem('todos');
    const todos = storedTodos ? JSON.parse(storedTodos) : [];
    setToDos(todos);
    return todos;
  };

  const addTodo = async (text: string): Promise<Todo> => {
    if (text.trim()) {
      await sleep(1000);
      const newTodo: Todo = { id: nextID, text, done: false };
      const updatedTodos = [...todos, newTodo];
      setToDos(updatedTodos);
      setNextID((prev) => prev + 1);
      return newTodo;
    }
    throw new Error('Todo text cannot be empty');
  };

  const removeTodo = async (id: number): Promise<void> => {
    const updatedTodos = todos.filter((todo) => todo.id !== id);
    setToDos(updatedTodos);
    localStorage.setItem('todos', JSON.stringify(updatedTodos));
  };

  const toggleDone = async (id: number): Promise<void> => {
    const updatedTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    );
    setToDos(updatedTodos);
    localStorage.setItem('todos', JSON.stringify(updatedTodos));
  };

  return {
    todos,
    addTodo,
    removeTodo,
    toggleDone,
    getTodos,
    input,
    setInput,
  };
};
