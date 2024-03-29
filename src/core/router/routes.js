import Index from '@Components/authentication/Index';
import Register from '@Components/authentication/Register';
import Admin from '@Components/admin/Admin';
import Home from '@Components/admin/home/Home';
import MachineLearning from '@Components/admin/home/pipelines/machine-learning/MachineLearning';
import Data from '@Components/admin/data/Data';
import DataImport from '@Components/admin/data/data-import/DataImport';
import FileManagement from '@Components/admin/data/file-management/FileManagement';
import DataManagement from '@Components/admin/data/data-management/DataManagement';
import FileContent from '@Components/admin/data/data-management/file-content/FileContent';
import DataVisualisation from '@Components/admin/data/data-visualisation/DataVisualisation';
import Jobs from '@Components/admin/jobs/Jobs';
import Settings from '@Components/admin/settings/Settings';
import UserPassword from '@Components/admin/settings/user-password/UserPassword';
import UserInfo from '@Components/admin/settings/user-info/UserInfo';
import Administration from '@Components/admin/administration/Administration';
import UserManagement from '@Components/admin/administration/user-management/UserManagement';
import TempPassword from '@Components/admin/administration/temp-password/TempPassword';
import JobsLog from '@Components/admin/administration/jobs-log/JobsLog';
import SourceManagement from '@Components/admin/administration/source-management/SourceManagement';
import MLManagement from '@Components/admin/administration/ml-management/MLManagement';
import WindowingManagement from '@Components/admin/administration/ml-management/windowing-management/WindowingManagement';
import FeatureManagement from '@Components/admin/administration/ml-management/feature-management/FeatureManagement';
import AlgoManagement from '@Components/admin/administration/ml-management/algo-management/AlgoManagement';
import AppKeys from '@Components/admin/administration/app-keys/AppKeys';
import SignOut from '@Components/admin/sign-out/SignOut';

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
        Controller: Home,
        SubComponents: [
          {
            name: 'machine-learning',
            Controller: MachineLearning
          }
        ]
      },
      {
        name: 'data',
        Controller: Data,
        SubComponents: [
          {
            name: 'data-import',
            Controller: DataImport
          },
          {
            name: 'file-management',
            Controller: FileManagement
          },
          {
            name: 'data-management',
            Controller: DataManagement,
            SubComponents: [
              {
                name: 'file-content',
                Controller: FileContent
              }
            ]
          },
          {
            name: 'data-visualisation',
            Controller: DataVisualisation
          }
        ]
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
            name: 'user-info',
            Controller: UserInfo
          }
        ]
      },
      {
        name: 'administration',
        Controller: Administration,
        SubComponents: [
          {
            name: 'user-management',
            Controller: UserManagement
          },
          {
            name: 'temp-password',
            Controller: TempPassword
          },
          {
            name: 'jobs-log',
            Controller: JobsLog
          },
          {
            name: 'app-keys',
            Controller: AppKeys
          },
          {
            name: 'source-management',
            Controller: SourceManagement
          },
          {
            name: 'ml-management',
            Controller: MLManagement,
            SubComponents: [
              {
                name: 'windowing-management',
                Controller: WindowingManagement
              },
              {
                name: 'feature-management',
                Controller: FeatureManagement
              },
              {
                name: 'algo-management',
                Controller: AlgoManagement
              }
            ]
          }
        ]
      },
      {
        name: 'signout',
        Controller: SignOut
      }
    ]
  }
];

export default routes;
