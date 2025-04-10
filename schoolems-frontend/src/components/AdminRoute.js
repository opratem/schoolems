import {  Navigate  }  from  "react-router-dom";
import  {  getCurrentUserRole  }  from  "../services/auth";
import  {  useEffect,  useState  }  from  'react';

function  AdminRoute({  children  })  {
  const  [role,  setRole]  =  useState(null);
  const  [loading,  setLoading]  =  useState(true);

  useEffect(()  =>  {
    (async  ()  =>  {
      setRole(await  getCurrentUserRole());
      setLoading(false);
    })();
  },  []);

  if  (loading)  return  null;  //  Or  a  loading  spinner
  return  role  ===  'ADMIN'  ?  children  :  <Navigate  to="/employees"  replace  />;
}

export  default  AdminRoute;