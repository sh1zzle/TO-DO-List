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

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const getTodos = async (): Promise<Todo[]> => {
    try {
      await sleep(1000);
      const storedTodos = localStorage.getItem('todos');

      if (!storedTodos) {
        throw new Error('No todos found in localStorage');
      }

      const todos = JSON.parse(storedTodos);
      setToDos(todos);

      return todos;
    } catch (error) {
      console.error('Error fetching todos:', error);
      throw error;
    }
  };

  //Testing error state in fetching
  // const getTodos = async (): Promise<Todo[]> => {
  //   // Simulate an error
  //   throw new Error('Simulated error fetching todos');
  //   // Your actual fetching logic would be here
  //   // return fetchTodosFromAPI();
  // };

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

  //Testing error state in adding
  // const addTodo = async (text: string): Promise<Todo> => {
  //   throw new Error('Simulated error adding todo');
  // };

  const removeTodo = async (id: number): Promise<void> => {
    try {
      setToDos((prevTodos) => {
        const updatedTodos = prevTodos.filter((todo) => todo.id !== id);

        if (updatedTodos.length === prevTodos.length) {
          console.error('Todo not found, no update performed');
          return prevTodos;
        }

        localStorage.setItem('todos', JSON.stringify(updatedTodos));
        console.log('updatedTodos: ', updatedTodos);
        return updatedTodos;
      });
    } catch (error) {
      console.error('Error removing todo:', error);
      throw error;
    }
  };

  const toggleDone = async (id: number): Promise<void> => {
    try {
      setToDos((prevTodos) => {
        const todoExists = prevTodos.some((todo) => todo.id === id);

        if (!todoExists) {
          throw new Error('Todo not found');
        }

        const updatedTodos = prevTodos.map((todo) =>
          todo.id === id ? { ...todo, done: !todo.done } : todo
        );

        localStorage.setItem('todos', JSON.stringify(updatedTodos));
        return updatedTodos;
      });
    } catch (error) {
      console.error('Error toggling todo:', error);
      throw error;
    }
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
