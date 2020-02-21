import { Home } from './../components/admin/Home';
import { RunningJobs } from './../components/admin/RunningJobs';
import { Admin } from '../pages/Admin';
import { Register } from '../pages/Register';
import { Index } from '../pages/Index';

const routes = [
	{
		name: 'index',
		controller: Index,
		components: []
	},
	{
		name: 'register',
		controller: Register,
		components: []
	},
	{
		name: 'admin',
		controller: Admin,
		components: [
			{
				name: 'home',
				component: Home
			},
			{
				name: 'running-jobs',
				component: RunningJobs
			}
		]
	}
];

export default routes;
