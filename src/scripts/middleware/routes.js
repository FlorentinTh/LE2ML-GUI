import { Home } from './../pages/components/admin/Home';
import { RunningJobs } from './../pages/components/admin/RunningJobs';

const routes = [
	{
		name: 'home',
		hash: '#home',
		component: Home
	},
	{
		name: 'running-jobs',
		hash: '#running-jobs',
		component: RunningJobs
	}
];

export default routes;
