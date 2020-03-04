import { Home } from './../components/admin/Home';
import { RunningJobs } from './../components/admin/RunningJobs';
import { Admin } from '../pages/Admin';
import { Register } from '../pages/Register';
import { Index } from '../pages/Index';

const routes = [
  {
    name: 'index',
    Controller: Index,
    Components: []
  },
  {
    name: 'register',
    Controller: Register,
    Components: []
  },
  {
    name: 'admin',
    Controller: Admin,
    Components: [
      {
        name: 'home',
        Component: Home
      },
      {
        name: 'running-jobs',
        Component: RunningJobs
      }
    ]
  }
];

export default routes;
