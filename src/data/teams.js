export const teams = [
	{
		userId: 'sam-0001',
		name: 'Sam',
		email: 'sam.obscura@gmail.com',
		projectAccess: {
			roles: ['owner','admin','photographer'],
			accessLevel: 'full-access'
		}
	},
	{
		userId: 'abhay-0000',
		email: 'abhaykvincent@gmail.com',
		projectAccess: {
			roles: ['admin','developer'],
			accessLevel: 'full-access'
		}
	}
];
export const fullAccess = (email) => {
    return teams.some(team => team.email === email && team.projectAccess.accessLevel === 'full-access');
};

export const getOwnerFromTeams = () => {
	return teams.filter(team => team.projectAccess.roles.includes('owner'))[0];
};