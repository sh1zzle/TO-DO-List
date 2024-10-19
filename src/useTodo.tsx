import { useState, useEffect } from 'react';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

export const useTodo = () => {
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
  const [loading, setLoading] = useState(false);

  const sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const getTodos = async (): Promise<void> => {
    setLoading(true);
    await sleep(3000);
    const storedTodos = localStorage.getItem('todos');
    if (storedTodos) {
      setToDos(JSON.parse(storedTodos));
    }
    setLoading(false);
  };

  const addTodo = async (text: string): Promise<void> => {
    if (text.trim()) {
      setLoading(true); // Start loading when adding
      await sleep(1000); // Simulate delay
      setToDos((prevTodos) => [
        ...prevTodos,
        { id: nextID, text, done: false },
      ]);
      setNextID((prev) => prev + 1);
      setLoading(false); // Stop loading after adding
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

  return {
    todos,
    addTodo,
    removeTodo,
    toggleDone,
    input,
    setInput,
    loading,
    getTodos,
  };
};
