import React from 'react';
import { useDispatch } from 'react-redux';
import { openModal } from '../../../app/slices/modalSlice';

export const SupportTab = ({ tickets }) => {
    const dispatch = useDispatch();

    return (
        <div className="invoice-history">
            <section className="support-list">
                <table className="invoice-table">
                    <thead>
                        <tr>
                            <th>Ticket ID</th>
                            <th>User</th>
                            <th>Issue</th>
                            <th>Status</th>
                            <th>Last Updated</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickets.map(ticket => (
                            <tr 
                                key={ticket.id} 
                                className="clickable-row" 
                                onClick={() => dispatch(openModal('viewDetailsDrawer', ticket))}
                            >
                                <td>{ticket.id}</td>
                                <td>{ticket.user}</td>
                                <td>{ticket.issue}</td>
                                <td>{ticket.status}</td>
                                <td>{ticket.lastUpdated}</td>
                                <td className="actions">
                                    {/* Drawer trigger */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
};
