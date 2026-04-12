import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Gradebook from './pages/Gradebook';
import CourseConfig from './pages/CourseConfig';
import Activities from './pages/Activities';
import Login from './pages/Login';

function ProtectedRoute({ children }) {
    const token = localStorage.getItem('sara_token');
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />

                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <MainLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="gradebook" element={<Gradebook />} />
                    <Route path="course-config" element={<CourseConfig />} />
                    <Route path="activities" element={<Activities />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
