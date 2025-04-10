import  {  useEffect,  useState  }  from  'react';
import  {  isAdmin  }  from  '../services/auth';

function  EmployeeActions({  employeeId,  onDelete  })  {
  const  [isUserAdmin,  setIsUserAdmin]  =  useState(false);

  useEffect(()  =>  {
    (async  ()  =>  {
      setIsUserAdmin(await  isAdmin());
    })();
  },  []);

  return  isUserAdmin  ?  (
    <button  onClick={()  =>  onDelete(employeeId)}>Delete  User</button>
  )  :  null;
}

export  default  EmployeeActions;