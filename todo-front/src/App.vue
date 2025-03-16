<template>
  <div id="app" class="container mt-5">
    <h1 class="text-center mb-4 fw-bold text-black">My Todo List 🚀</h1>

    <div v-if="isLoading" class="text-center my-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show" role="alert">
      {{ errorMessage }}
      <button type="button" class="btn-close" @click="errorMessage = ''"></button>
    </div>

    <!-- Form สำหรับเพิ่ม Todo -->
    <div class="glass-card p-4 mb-4">
      <form @submit.prevent="addTodo">
        <div class="mb-3">
          <input
            v-model="newTodo.name"
            type="text"
            class="form-control rounded-pill shadow-sm"
            placeholder="Enter task name"
            required
          />
        </div>
        <div class="mb-3">
          <select v-model="newTodo.status" class="form-select rounded-pill shadow-sm" required>
            <option value="to-do">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="finished">Finished</option>
          </select>
        </div>
        <button type="submit" class="btn-gradient w-100">+ Add Todo</button>
      </form>
    </div>

    <!-- Form สำหรับแก้ไข Todo -->
    <div v-if="todoToEdit" class="glass-card p-4 mb-4">
      <h2 class="text-black">Edit Todo 📝</h2>
      <form @submit.prevent="updateTodo">
        <div class="mb-3">
          <input
            v-model="todoToEdit.name"
            type="text"
            class="form-control rounded-pill shadow-sm"
            required
          />
        </div>
        <div class="mb-3">
          <select v-model="todoToEdit.status" class="form-select rounded-pill shadow-sm" required>
            <option value="to-do">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="finished">Finished</option>
          </select>
        </div>
        <button type="submit" class="btn-gradient w-100">💾 Update</button>
        <button type="button" @click="cancelEdit" class="btn-gradient w-100 mt-2">Cancel</button>
      </form>
    </div>

    <!-- แสดงรายการ Todo -->
    <div class="glass-card p-3">
      <ul class="list-group">
        <li
          v-for="todo in todos"
          :key="todo.id"
          class="list-group-item d-flex justify-content-between align-items-center"
        >
          <div class="todo-content d-flex align-items-center flex-wrap">
            <i class="fas fa-check-circle text-success me-4"></i>
            <span :class="{ 'text-decoration-line-through': todo.status === 'finished' }" class="me-3">
              {{ todo.name }}
            </span>
            <span
              :class="{
                'badge bg-warning text-dark': todo.status === 'to-do',
                'badge bg-info text-white': todo.status === 'in-progress',
                'badge bg-success text-white': todo.status === 'finished'
              }"
              class="badge-status"
            >
              {{ todo.status }}
            </span>
          </div>
          <div class="todo-actions">
            <span @click="editTodo(todo)" class="text-warning cursor-pointer me-4">
              <i class="fa-solid fa-edit" style="margin-left: 50px;"></i>
            </span>
            <span @click="deleteTodo(todo.id)" class="text-danger cursor-pointer">
              <i class="fa-solid fa-trash"></i>
            </span>
          </div>
        </li>
        <li v-if="todos.length === 0" class="list-group-item text-center text-muted">
          No todos yet. Add one to get started! 🚀
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import Swal from "sweetalert2";

export default {
  name: "App",
  data() {
    return {
      todos: [],
      newTodo: {
        name: "",
        status: "to-do",
      },
      todoToEdit: null,
      isLoading: false,
      errorMessage: "",
    };
  },
  methods: {
    async fetchTodos() {
      this.isLoading = true;
      this.errorMessage = "";
      try {
        const response = await axios.get("http://localhost:5000/api/todo");
        this.todos = response.data;
      } catch (error) {
        this.errorMessage = "Failed to fetch todos. Please try again later.";
        console.error("Error fetching todos:", error);
      } finally {
        this.isLoading = false;
      }
    },
    async addTodo() {
      if (!this.newTodo.name.trim()) {
        Swal.fire({
          icon: "warning",
          title: "Oops...",
          text: "Please enter a todo name!",
        });
        return;
      }
      this.isLoading = true;
      try {
        await axios.post("http://localhost:5000/api/todo", this.newTodo);
        this.newTodo.name = "";
        this.newTodo.status = "to-do";
        await this.fetchTodos();
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Todo added successfully!",
          showConfirmButton: false,
          timer: 1500,
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to add todo. Please try again.",
        });
        console.error("Error adding todo:", error.response || error.message);
      } finally {
        this.isLoading = false;
      }
    },
    async deleteTodo(id) {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ff416c",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        this.isLoading = true;
        try {
          await axios.delete(`http://localhost:5000/api/todo/${id}`);
          await this.fetchTodos();
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Todo has been deleted.",
            showConfirmButton: false,
            timer: 1500,
          });
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to delete todo. Please try again.",
          });
          console.error("Error deleting todo:", error);
        } finally {
          this.isLoading = false;
        }
      }
    },
    editTodo(todo) {
      this.todoToEdit = { ...todo };
    },
    async updateTodo() {
      this.isLoading = true;
      try {
        await axios.put(`http://localhost:5000/api/todo/${this.todoToEdit.id}`, this.todoToEdit);
        this.todoToEdit = null;
        await this.fetchTodos();
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Todo has been updated successfully.",
          showConfirmButton: false,
          timer: 1500,
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to update todo. Please try again.",
        });
        console.error("Error updating todo:", error);
      } finally {
        this.isLoading = false;
      }
    },
    cancelEdit() {
      this.todoToEdit = null;
      Swal.fire({
        icon: "info",
        title: "Cancelled",
        text: "Edit cancelled.",
        showConfirmButton: false,
        timer: 1500,
      });
    },
  },
  mounted() {
    this.fetchTodos();
  },
};
</script>

<style scoped>
/* 🎨 Glassmorphism Style */
body {
  background: linear-gradient(135deg, #ff9a9e, #fad0c4);
  min-height: 100vh;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

#app {
  max-width: 600px; /* กำหนดความกว้างสูงสุดสำหรับ Web */
  margin: auto;
  padding: 0 15px; /* เพิ่ม padding เพื่อรองรับ Mobile */
}

/* Glass Effect */
.glass-card {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: transform 0.3s ease;
}

.glass-card:hover {
  transform: translateY(-5px);
}

/* Gradient Button */
.btn-gradient {
  background: linear-gradient(45deg, #ff416c, #ff4b2b);
  color: white;
  padding: 12px;
  border: none;
  border-radius: 25px;
  font-weight: bold;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.btn-gradient:hover {
  transform: scale(1.05);
  opacity: 0.9;
}

.btn-gradient-secondary {
  background: linear-gradient(45deg, #ff8fa3, #ff577f);
  color: white;
  padding: 12px;
  border: none;
  border-radius: 25px;
  font-weight: bold;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.btn-gradient-secondary:hover {
  transform: scale(1.05);
  opacity: 0.9;
}

/* Form Inputs */
.form-control,
.form-select {
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.1);
  color: #333;
  transition: all 0.3s ease;
  font-size: 1rem;
  padding: 10px;
}

.form-control:focus,
.form-select:focus {
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 5px rgba(255, 87, 127, 0.5);
  border-color: #ff577f;
}

/* List Items */
.list-group-item {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  margin-bottom: 10px;
  padding: 15px;
  border: none;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.list-group-item:hover {
  background: rgba(255, 255, 255, 0.4);
}

/* Todo Content */
.todo-content {
  flex: 1;
  display: flex;
  align-items: center;
  flex-wrap: wrap; /* อนุญาตให้ wrap ในกรณีที่เนื้อหายาวเกิน */
  gap: 10px; /* ระยะห่างระหว่างองค์ประกอบใน Todo */
}

/* Badge Status */
.badge-status {
  margin-left: 30px; /* ระยะห่างจากชื่อ Todo */
}

/* Todo Actions (Icons) */
.todo-actions {
  display: flex;
  align-items: center;
  gap: 20px; /* ระยะห่างระหว่างไอคอน */
}

/* Badges */
.badge {
  font-size: 0.9rem;
  padding: 6px 12px;
}

/* Icons */
.cursor-pointer {
  cursor: pointer;
  transition: transform 0.3s ease;
  font-size: 1.2rem;
}

.cursor-pointer:hover {
  transform: scale(1.2);
}

/* Text Decoration */
.text-decoration-line-through {
  text-decoration: line-through;
  opacity: 0.7;
}

/* Responsive Design */
@media (max-width: 768px) {
  h1 {
    font-size: 1.5rem;
  }

  .glass-card {
    padding: 15px;
  }

  .form-control,
  .form-select {
    font-size: 0.9rem;
    padding: 8px;
  }

  .btn-gradient,
  .btn-gradient-secondary {
    font-size: 0.9rem;
    padding: 10px;
  }

  .list-group-item {
    font-size: 0.9rem;
    padding: 10px;
  }

  .todo-content {
    gap: 8px; /* ลดระยะห่างใน Mobile */
  }

  .badge-status {
    margin-left: 15px; /* ลดระยะห่างใน Mobile */
  }

  .todo-actions {
    gap: 15px; /* ลดระยะห่างระหว่างไอคอนใน Mobile */
  }

  .cursor-pointer {
    font-size: 1.1rem;
  }
}

@media (max-width: 576px) {
  #app {
    padding: 0 10px; /* ปรับ padding สำหรับ Mobile */
  }

  h1 {
    font-size: 1.3rem;
  }

  .glass-card {
    padding: 10px;
  }

  .form-control,
  .form-select {
    font-size: 0.85rem;
    padding: 6px;
  }

  .btn-gradient,
  .btn-gradient-secondary {
    font-size: 0.85rem;
    padding: 8px;
  }

  .list-group-item {
    font-size: 0.85rem;
    padding: 8px;
  }

  .todo-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .badge-status {
    margin-left: 0; /* ไม่ใช้ margin-left ใน Mobile ให้ใช้ flex-wrap แทน */
  }

  .todo-actions {
    gap: 10px;
    margin-top: 5px; /* เพิ่มระยะห่างจากเนื้อหาใน Mobile */
  }

  .cursor-pointer {
    font-size: 1rem;
  }
}
</style>