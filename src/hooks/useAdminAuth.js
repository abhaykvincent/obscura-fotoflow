import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const useAdminAuth = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();


  return isAdmin;
};

export default useAdminAuth;
