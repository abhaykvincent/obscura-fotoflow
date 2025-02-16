import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Notifications.scss'
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, selectAllNotifications } from '../../app/slices/notificationSlice';
import { selectDomain, setCurrentStudio } from '../../app/slices/authSlice';
import NotificationCard from './NotificationCard';

function Notifications() {
	const dispatch = useDispatch();
	const studio = useSelector(selectDomain)
	const notifications = useSelector(selectAllNotifications);
	const [notificationsRecent, setNotificationsRecent] = React.useState([]);
	const [notificationsOlder, setNotificationsOlder] = React.useState([]);

	useEffect(() => {
	  dispatch(fetchNotifications(studio));
	}, [dispatch]);

	useEffect(() => {
		// Group notifications by recent (last 7 days)
		const recentNotifications = notifications.filter(n => 
		  new Date(n.metadata.createdAt) > Date.now() - 7 * 24 * 60 * 60 * 1000
		);
	  
		const olderNotifications = notifications.filter(n => 
		  new Date(n.metadata.createdAt) <= Date.now() - 7 * 24 * 60 * 60 * 1000
		);
	  
		console.log('Recent Notifications:', recentNotifications);
		console.log('Older Notifications:', olderNotifications);

		setNotificationsRecent(recentNotifications);
		setNotificationsOlder(olderNotifications);
	  }, [notifications]);
	
  
	
  return (
	<div className="notifications-page">
		<div className="project-info notifications-page-info">
			<div className="breadcrumbs">
				<Link className="back " to={`/`}>Home </Link>
			</div>
			<div className="client">
				<h1>Notifications</h1>
				<div className="type"></div>
			</div>
		<div className="project-options"></div>
      	</div>
		<main>
			<div className="notifications-list">
				<label  className="label" htmlFor="">{`${notificationsRecent.length } new notifications`}</label>
				{notificationsRecent.map(notification => (
				<NotificationCard
					key={notification.id}
					recent={true}
					{...notification}
				/>
				))}
				<label  className="label" htmlFor="">{`Last week`}</label>

				{notificationsOlder.map(notification => (
				<NotificationCard
					key={notification.id}
					recent={false}
					{...notification}
				/>
				))}
			</div>
		</main>
		
		
	</div>
  )
}

export default Notifications
// Line Complexity  0.5 ->