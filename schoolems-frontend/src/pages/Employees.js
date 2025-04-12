import { useEffect, useState } from "react";
import { fetchEmployees, deleteEmployee } from "../services/api";
import { getCurrentUserRole } from "../services/auth";
import EmployeeActions from '../components/EmployeeActions';

function Employees() {
    const [employees, setEmployees] = useState([]);
    const [currentUserRole, setCurrentUserRole] = useState('');

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchEmployees();
            setEmployees(data);
            const role = await getCurrentUserRole();
            setCurrentUserRole(role);
        };
        loadData();
    }, []);

    const handleDeleteEmployee = async (id) => {
        try {
            await deleteEmployee(id);
            setEmployees(employees.filter((emp) => emp.id !== id));
        } catch(error) {
            if (error.response?.status === 403) {
                alert("Only ADMIN can delete employees!");
            } else {
                alert("Error deleting employee");
            }
        }
    };

    return (
        <div className="container mt-4">
            <h1 className="mb-4">Employees</h1>
           {employees.length === 0 ? (
             <div className="alert alert-info">No employees found.</div>
           ) : (
             <ul className="list-group">
                {employees.map((emp) => (
                    <li
                        key={emp.id}
                        className="list-group-item d-flex justify-content-between align-items-center"
                     >
                        <div>
                            <strong>{emp.name}</strong> <br />
                             <span className="text-muted">{emp.department}</span> - Role: {emp.role}
                        </div>
                        <EmployeeActions
                            employeeId={emp.id}
                            onDelete={handleDeleteEmployee}
                            currentUserRole={currentUserRole}
                        />
                    </li>
                ))}
            </ul>
           )}
        </div>
    );
}

export default Employees;