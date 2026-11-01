import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from '../app/slices/authSlice';
import { isAdminUser } from '../utils/adminAuth';

/**
 * Returns true only for an authenticated FotoFlow admin.
 *
 * Authorization is derived from the existing auth slice + admin identity
 * helper; components must still check this value before rendering developer
 * features so the mode can never be reached by hiding a control alone.
 */
const useAdminAuth = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  return isAuthenticated && isAdminUser(user);
};

export default useAdminAuth;
