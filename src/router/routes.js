import Index from '@Components/authentication/Index';
import Register from '@Components/authentication/Register';
import Admin from '@Components/admin/Admin';
import Home from '@Components/admin/home/Home';
import Jobs from '@Components/admin/jobs/Jobs';
import Settings from '@Components/admin/settings/Settings';
import UserPassword from '@Components/admin/settings/user-password/UserPassword';
import UserInfos from '@Components/admin/settings/user-infos/UserInfos';
import Administration from '@Components/admin/administration/Administration';
import UsersManagement from '@Components/admin/administration/users-management/UsersManagement';
import JobsManagement from '@Components/admin/administration/jobs-management/JobsManagement';

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
        Controller: Home
      },
      {
        name: 'jobs',
        Controller: Jobs
      },
      {
        name: 'my-account',
        Controller: Settings,
        SubComponents: [
          {
            name: 'user-password',
            Controller: UserPassword
          },
          {
            name: 'user-infos',
            Controller: UserInfos
          }
        ]
      },
      {
        name: 'administration',
        Controller: Administration,
        SubComponents: [
          {
            name: 'users-management',
            Controller: UsersManagement
          },
          {
            name: 'jobs-management',
            Controller: JobsManagement
          }
        ]
      }
    ]
  }
];

export default routes;
