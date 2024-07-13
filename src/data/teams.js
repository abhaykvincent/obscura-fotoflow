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
		name: 'Abhay',
		email: 'abhaykvincent@gmail.com',
		projectAccess: {
			roles: ['admin','developer','assistant'],
			accessLevel: 'full-access'
		}
	},
	{
		userId: 'ashish-0000',
		name: 'Ashish',
		email: 'ashishkvincent@gmail.com',
		projectAccess: {
			roles: ['photographer'],
			accessLevel: 'project-access'
		}
	},
	{
		userId: 'john-0000',
		name: 'John',
		email: 'john.doe@gmail.com',
		projectAccess: {
			roles: ['designer'],
			accessLevel: 'project-access'
		}
	},
	{
		userId: 'jane-0000',
		name: 'Jane',
		email: 'jane.doe@gmail.com',
		projectAccess: {
			roles: ['assistant'],
			accessLevel: 'project-access'
		}
	},
	{
		userId: 'joey-0000',
		name: 'Joey',
		email: 'joey.doe@gmail.com',
		projectAccess: {
			roles: ['assistant'],
			accessLevel: 'project-access'
		}
	}
];
export const fullAccess = (email) => {
    return teams.some(team => team.email === email && team.projectAccess.accessLevel === 'full-access');
};

export const getOwnerFromTeams = () => {
	return teams.filter(team => team.projectAccess.roles.includes('owner'))[0];
};

export const getUserByID = (id) => {
	return teams.find(team => team.userId === id);
};
export const getUsersByRole = (role) => {
	return teams.filter(team => team.projectAccess.roles.includes(role));
};