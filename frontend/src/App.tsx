import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Button,
  Box,
  useMediaQuery,
  useTheme,
  Avatar
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
import { MobileMenu } from './components/MobileMenu'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const isModerator = localStorage.getItem('isModerator') === 'true';
  const isSuperuser = localStorage.getItem('isSuperuser') === 'true';
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem('userId');
    localStorage.removeItem('isModerator');
    localStorage.removeItem('isSuperuser');
    setIsAuthenticated(false);
  };

  const menuItems = [
    { text: 'Задачи', path: '/' },
    { text: 'Сотрудники', path: '/employees' },
    { text: 'Важные задачи', path: '/important' },
    { text: 'Занятость', path: '/employees-tasks' },
    ...(isModerator || isSuperuser ? [{ text: 'Пользователи', path: '/users' }] : []),
    ...(isAuthenticated ? [
      { text: 'Мой профиль', path: `/user/${localStorage.getItem('userId')}` },
      { text: 'Выйти', onClick: handleLogout }
    ] : [
      { text: 'Регистрация', path: '/register' },
      { text: 'Войти', path: '/login' }
    ])
  ];

  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <MobileMenu 
            menuItems={menuItems}
            onDrawerToggle={handleDrawerToggle}
            mobileOpen={mobileOpen}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar 
              src="/favicon.svg" 
              alt="Task Tracker"
              sx={{ 
                width: 32, 
                height: 32,
                bgcolor: 'transparent'
              }}
          />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Task Tracker
          </Typography>
          </Box>
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  component={item.onClick ? 'button' : Link}
                  to={item.path}
                  onClick={item.onClick}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}
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
              <EmployeeForm />
            </ProtectedRoute>
          } />
          <Route path="/employee/update/:id" element={
            <ProtectedRoute requiresModeration>
              <EmployeeForm />
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