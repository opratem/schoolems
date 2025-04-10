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
        <div>
            <h1>Employees</h1>
            <ul>
                {employees.map((emp) => (
                    <li key={emp.id}>
                        {emp.name} - {emp.department} - Role: {emp.role}
                        <EmployeeActions
                            employeeId={emp.id}
                            onDelete={handleDeleteEmployee}
                            currentUserRole={currentUserRole}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Employees;