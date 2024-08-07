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
		userId: 'abhay-0002',
		name: 'Abhay',
		email: 'abhaykvincent@gmail.com',
		projectAccess: {
			roles: ['admin','developer','assistant'],
			accessLevel: 'full-access'
		}
	},
	{
		userId: 'ashish-0003',
		name: 'Ashish',
		email: 'ashishkvincent@gmail.com',
		projectAccess: {
			roles: ['photographer'],
			accessLevel: 'project-access'
		}
	},
	{
		userId: 'john-0004',
		name: 'John',
		email: 'john.doe@gmail.com',
		projectAccess: {
			roles: ['designer'],
			accessLevel: 'project-access'
		}
	},
	{
		userId: 'jane-0005',
		name: 'Jane',
		email: 'jane.doe@gmail.com',
		projectAccess: {
			roles: ['assistant'],
			accessLevel: 'project-access'
		}
	},
	{
		userId: 'joey-0006',
		name: 'Joey',
		email: 'joey.doe@gmail.com',
		projectAccess: {
			roles: ['assistant'],
			accessLevel: 'project-access'
		}
	}
];

export const users = [
	{
		userId: 'abhay-0002',
		name: 'Abhay',
		email: 'abhaykvincent@gmail.com',
		studios:['jazmiro']
	},
	{
		userId: 'sam-0001',
		name: 'Sam',
		email: 'sam.obscura@gmail.com',
		studios:['obscura']
	},
	{
		userId: 'mirza-0001',
		name: 'Mirza',
		email: 'jazmiro.web@gmail.com',
		studios:['jazmiro']
	},
]
export const studios = [
	{
		domain: 'monalisa',
		name: 'Monalisa'
	},
	{
		domain: 'obscura',
		name: 'Obscura'
	
	},
	{
		domain: 'jazmiro',
		name: 'Jazmiro'
	},
	{
		domain: 'erwethryjthg',
		name: 'erwethryjthg'
	},
]
export const fullAccess = (email) => {
    return teams.some(team => team.email === email && team.projectAccess.accessLevel === 'full-access');
};
export const isAlreadyInStudio = (email, studio) => {
    return users.some(user => user.email === email && user.studios.includes(studio));
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

export const getStudiosOfUser = (email) => {
    const user = users.find(user => user.email === email);
	let userStudios = studios.find(studio => studio.domain === user.studios[0]);
    return user ? userStudios : [];
};
