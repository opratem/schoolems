import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// This component now simply redirects to the main leave requests page with the action=submit parameter
// to automatically open the submission modal

const LeaveRequestSubmit = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the main leave requests page with the action parameter
    navigate("/leaverequests?action=submit", { replace: true });
  }, [navigate]);

  return null; // No UI needed as this immediately redirects
};

export default LeaveRequestSubmit;
