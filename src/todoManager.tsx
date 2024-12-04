interface Todo {
  id: number;
  text: string;
  done: boolean;
}

export default class TodoManager {
  private todos: Todo[];
  private nextID: number;

  constructor() {
    this.todos = this.loadTodosFromStorage();
    this.nextID = this.calculateNextID();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private loadTodosFromStorage(): Todo[] {
    const savedTodos = localStorage.getItem('todos');
    return savedTodos ? JSON.parse(savedTodos) : [];
  }

  private calculateNextID(): number {
    return this.todos.length > 0
      ? Math.max(...this.todos.map((todo) => todo.id)) + 1
      : 1;
  }

  private saveTodosToStorage(): void {
    localStorage.setItem('todos', JSON.stringify(this.todos));
  }

  public async fetchTodos(): Promise<Todo[]> {
    await this.sleep(1000);
    this.todos = this.loadTodosFromStorage();
    return this.todos;
  }

  public async removeTodo(id: number): Promise<void> {
    await this.sleep(1000);
    const initialLength = this.todos.length;
    this.todos = this.todos.filter((todo) => todo.id !== id);

    if (this.todos.length === initialLength) {
      throw new Error('Todo not found');
    }

    this.saveTodosToStorage();
  }

  async updateTodo(id: number, done: boolean): Promise<void> {
    const todoIndex = this.todos.findIndex((todo) => todo.id === id);

    if (todoIndex === -1) {
      throw new Error(`Todo with ID ${id} not found.`);
    }

    await this.sleep(1000); // Simulate a delay
    this.todos[todoIndex].done = done;
    this.saveTodosToStorage();
  }

  public async addTodo(text: string): Promise<Todo> {
    await this.sleep(1000);

    if (!text.trim()) {
      throw new Error('Todo text cannot be empty');
    }

    const newTodo: Todo = { id: this.nextID, text, done: false };
    this.todos.push(newTodo);
    this.nextID += 1;
    this.saveTodosToStorage();

    return newTodo;
  }

  public async editTodo(updatedTodo: Todo): Promise<Todo> {
    await this.sleep(1000);

    // Validate that the updated text is not empty
    if (!updatedTodo.text.trim()) {
      throw new Error('Todo text cannot be empty');
    }

    // Find the todo in the list by ID and update it
    const index = this.todos.findIndex((todo) => todo.id === updatedTodo.id);

    if (index === -1) {
      throw new Error('Todo not found');
    }

    // Update the todo
    this.todos[index] = { ...this.todos[index], ...updatedTodo };

    // Save the updated todos to storage
    this.saveTodosToStorage();

    return this.todos[index];
  }
}
