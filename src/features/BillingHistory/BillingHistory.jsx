import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectDomain,
  selectUserStudio,
} from '../../app/slices/authSlice';
import {
  fetchStudioSubscriptions,
  selectCurrentSubscription,
  selectStudio,
  selectStudioSubscriptions,
} from '../../app/slices/studioSlice';
import Refresh from '../../components/Refresh/Refresh';
import { getDaysFromNow, getEventTimeAgo } from '../../utils/dateUtils';

import './BillingHistory.scss';

export default function BillingHistory() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const domain = useSelector(selectDomain);
  const defaultStudio = useSelector(selectUserStudio);
  const studio= useSelector(selectStudio)
  const currentSubscription = useSelector(selectCurrentSubscription);
  const subscriptions = useSelector(selectStudioSubscriptions);

  // State for search and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    dispatch(fetchStudioSubscriptions({ studioId: defaultStudio.domain }));
  }, [dispatch, defaultStudio]);

  // Map subscriptions to invoice format
  const invoices = subscriptions.map((subscription) => ({
    invoiceId: subscription.id,
    status: subscription.status,
    amount: `₹${subscription.pricing.totalPrice / 100}`, // Assuming price is in cents
    created: new Date(subscription.dates.startDate).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }),
    viewLink: '#', // Replace with actual link if needed
    downloadLink: '#', // Placeholder for download functionality
  }));

  // Filter and sort invoices
  const filteredInvoices = invoices.filter((invoice) =>
    invoice.invoiceId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    const valueA = a[sortBy];
    const valueB = b[sortBy];
    if (sortBy === 'created') {
      return sortOrder === 'asc'
        ? new Date(valueA) - new Date(valueB)
        : new Date(valueB) - new Date(valueA);
    }
    return sortOrder === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
  });

  // Handle sorting
  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  // Calculate totals
  const totalPaid = subscriptions
    .filter((s) => s.billing.paymentRecived)
    .reduce((sum, s) => sum + s.pricing.totalPrice / 100, 0);
  const totalOutstanding = subscriptions
    .filter((s) => !s.billing.paymentRecived)
    .reduce((sum, s) => sum + s.pricing.totalPrice / 100, 0);

  return (
    <div className="billing-container">

      {/* Current Plan Section */}
      <div className="current-plan">
        <h2 className="section-title">Current Plan</h2>
        <div className="plan-details">
          <p>
            <strong>Plan Name & Cost:</strong>{' '}
            {currentSubscription.plan.name}: ₹
            {currentSubscription.pricing.totalPrice / 100}{' '}
            <span
              className={`status-tag ${
                currentSubscription.billing.paymentRecived ? 'paid' : 'unpaid'
              }`}
            >
              {currentSubscription.billing.paymentRecived ? 'Paid' : 'Unpaid'}
            </span>
          </p>
          <p>
            <strong>Invoice ID:</strong>{' '}
            <Link to="#" className="link">
              {currentSubscription.id}
            </Link>
          </p>
          <p>
            <strong>Last Updated:</strong>{' '}
            {getEventTimeAgo(studio.startDate)}
          </p>
          <p>
            <strong>Plan Expiration:</strong>{' '}
            {getDaysFromNow(studio.endDate)} days remaining
          </p>
          <p>
            <strong>Free Trial:</strong>{' '}
            Ends in {getDaysFromNow(studio.trialEndDate)}{' '}
            days <span className="trial-progress"></span>
          </p>
        </div>
      </div>

      {/* Invoice History Section */}
      <div className="invoice-history">
        <h2 className="section-title">Invoice History (Past 12 Months)</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by invoice ID, date, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <table className="invoice-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('invoiceId')}>
                Invoice{' '}
                {sortBy === 'invoiceId' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('status')}>
                Status{' '}
                {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('amount')} className="align-right">
                Amount{' '}
                {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('created')} className="align-right">
                Created{' '}
                {sortBy === 'created' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedInvoices.map((invoice, index) => (
              <tr key={index}>
                <td>{invoice.invoiceId}</td>
                <td>
                  <span
                    className={`status-tag ${
                      invoice.status === 'active' ? 'paid' : 'unpaid'
                    }`}
                  >
                    {invoice.status}
                  </span>
                </td>
                <td className="align-right">{invoice.amount}</td>
                <td className="align-right">{invoice.created}</td>
                <td className="actions">
                  <Link to={invoice.viewLink} className="link">
                    View
                  </Link>{' '}
                  |{' '}
                  <Link to={invoice.downloadLink} className="link">
                    Download
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="summary">
          <p>
            Total Paid: ₹{totalPaid.toFixed(2)} | Outstanding: ₹
            {totalOutstanding.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Refresh Component */}
      <Refresh />
    </div>
  );
}