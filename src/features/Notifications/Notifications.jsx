import React from 'react'
import { Link } from 'react-router-dom'
import './Notifications.scss'
import NotificationCard from '../../components/Notofications/NotificationCard'

function Notifications(notifications) {
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
				{/* loop 10 times */}
				{
					Array.from({length: 4}).map((_,i)=>{
					return (
						<NotificationCard key={i} title="Lorem ipsum dolor sit amet consectetur." 
						context="Lorem ipsum dolor sit amet consectetur adipisicing elit. Pariatur iure quis omnis." 
						i={i}
						recent={true}
						/>
					)})
				}
				{
					Array.from({length: 6}).map((_,i)=>{
					return (
						<NotificationCard key={i} title="Lorem ipsum dolor sit amet consectetur." 
						context="Lorem ipsum dolor sit amet consectetur adipisicing elit. Pariatur iure quis omnis." 
						i={i+9}
						recent={false}
						/>
					)})
				}
			</div>
		</main>
		
		
	</div>
  )
}

export default Notifications
// Line Complexity  0.5 ->