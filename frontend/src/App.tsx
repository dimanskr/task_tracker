import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Button,
  Box
} from '@mui/material'
import { TaskList } from './components/TaskList'
import { EmployeeList } from './components/EmployeeList'
import { ImportantTasks } from './components/ImportantTasks'
import { EmployeesTasks } from './components/EmployeesTasks'
import { TaskForm } from './components/TaskForm'
import { EmployeeForm } from './components/EmployeeForm'
import { Login } from './components/Login'
import { Register } from './components/Register'
import { removeAuthToken } from './api'
import { TaskView } from './components/TaskView'
import { UserList } from './components/UserList'
import { UserProfile } from './components/UserProfile'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const isModerator = localStorage.getItem('isModerator') === 'true';
  const isSuperuser = localStorage.getItem('isSuperuser') === 'true';

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem('userId');
    localStorage.removeItem('isModerator');
    localStorage.removeItem('isSuperuser');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Task Tracker
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button color="inherit" component={Link} to="/">
              Задачи
            </Button>
            <Button color="inherit" component={Link} to="/employees">
              Сотрудники
            </Button>
            <Button color="inherit" component={Link} to="/important">
              Важные задачи
            </Button>
            <Button color="inherit" component={Link} to="/employees-tasks">
              Занятость
            </Button>
            {(isModerator || isSuperuser) && (
              <Button color="inherit" component={Link} to="/users">
                Пользователи
              </Button>
            )}
            {isAuthenticated ? (
              <>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to={`/user/${localStorage.getItem('userId')}`}
                >
                  Мой профиль
                </Button>
                <Button 
                  color="inherit" 
                  onClick={handleLogout}
                >
                  Выйти
                </Button>
              </>
            ) : (
              <>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/register"
                >
                  Регистрация
                </Button>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/login"
                >
                  Войти
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={<TaskList />} />
          <Route path="/task/:id" element={<TaskView />} />
          <Route path="/task/create" element={
            <ProtectedRoute requiresModeration>
              <TaskForm mode="create" />
            </ProtectedRoute>
          } />
          <Route path="/task/update/:id" element={
            <ProtectedRoute requiresModeration>
              <TaskForm mode="edit" />
            </ProtectedRoute>
          } />
          <Route path="/employees" element={<EmployeeList />} />
          <Route path="/employee/create" element={
            <ProtectedRoute requiresModeration>
              <EmployeeForm mode="create" />
            </ProtectedRoute>
          } />
          <Route path="/employee/update/:id" element={
            <ProtectedRoute requiresModeration>
              <EmployeeForm mode="edit" />
            </ProtectedRoute>
          } />
          <Route path="/important" element={<ImportantTasks />} />
          <Route path="/employees-tasks" element={<EmployeesTasks />} />
          <Route path="/users" element={
            <ProtectedRoute requiresModeration>
              <UserList />
            </ProtectedRoute>
          } />
          <Route path="/user/:id" element={<UserProfile />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login onLoginSuccess={(userId, isModerator, isSuperuser) => {
            // console.log('Login success:', { userId, isModerator, isSuperuser });
            setIsAuthenticated(true);
            if (userId) {
              localStorage.setItem('userId', userId.toString());
            }
            localStorage.setItem('isModerator', isModerator.toString());
            localStorage.setItem('isSuperuser', isSuperuser.toString());
          }} />} />
        </Routes>
      </Container>
    </Router>
  )
}

export default App 