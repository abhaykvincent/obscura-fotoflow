import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectDomain,
  selectUserStudio,
} from '../../app/slices/authSlice';
import {
  fetchStudioSubscriptions,
  fetchStudioInvoices,
  selectCurrentSubscription,
  selectStudio,
  selectStudioSubscriptions,
  selectStudioInvoices
} from '../../app/slices/studioSlice';
import Refresh from '../../components/Refresh/Refresh';
import { getDaysFromNow, getEventTimeAgo } from '../../utils/dateUtils';
import CurrentPlanSection from './CurrentPlanSection'; // Import the new component


import './BillingHistory.scss';

export default function BillingHistory() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const domain = useSelector(selectDomain);
  const defaultStudio = useSelector(selectUserStudio);
  const studio= useSelector(selectStudio)
  const currentSubscription = useSelector(selectCurrentSubscription);
  const subscriptions = useSelector(selectStudioSubscriptions);
  const invoices = useSelector(selectStudioInvoices);

  // State for search and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    console.log(invoices)
  }, [invoices]);  
  useEffect(() => {
    dispatch(fetchStudioSubscriptions({ studioId: defaultStudio.domain }));
    dispatch(fetchStudioInvoices({ studioId: defaultStudio.domain }));
  }, [dispatch, defaultStudio]);
  
  // Map subscriptions to invoice format
  console.log(subscriptions)
  console.log(currentSubscription)
  const subscriptionsTable = subscriptions.map((subscription) => ({
    invoiceId: subscription.id,
    status: subscription.status,
    amount: `₹${subscription.pricing.totalPrice / 100}`, // Assuming price is in cents
    created: new Date(subscription.dates?.startDate).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }),
    billing:subscription.billing,
    plan:subscription.plan,
    dates:subscription.dates,
    viewLink: '#', // Replace with actual link if needed
    downloadLink: '#', // Placeholder for download functionality
  }));

  // Filter and sort Subscriptions
  const filteredSubscriptions = subscriptionsTable.filter((invoice) =>
    invoice.invoiceId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
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
    .filter((s) => s.billing?.paymentRecived)
    .reduce((sum, s) => sum + s.pricing.totalPrice / 100, 0);
  const totalOutstanding = subscriptions
    .filter((s) => !s.billing?.paymentRecived)
    .reduce((sum, s) => sum + s.pricing?.totalPrice / 100, 0);

  return (
    <div className="billing-container">

      {/* Current Plan Section - Now a separate component */}
      <CurrentPlanSection
        currentSubscription={currentSubscription}
        studio={studio}
        getDaysFromNow={getDaysFromNow} // Pass utility functions if needed by the child
        getEventTimeAgo={getEventTimeAgo} // Pass utility functions if needed by the child
      />

      {/* Subscriprions History Section */}
      <div className="invoice-history">
        <h2 className="section-title">Subscriptions</h2>
        <table className="invoice-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('invoiceId')}>
                Plan{' '}
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
              <th onClick={() => handleSort('created')} className="align-right">
                Next payment{' '}
                {sortBy === 'created' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscriptionsTable.map((invoice, index) => (
              <tr key={index} className={`${invoice.status}`}>
                <td>{invoice.plan?.name}</td>
                <td>
                  <span
                    className={`status-tag ${
                      invoice.status === 'active' ? 'paid' : 'unpaid'
                    }`}
                  >
                    {invoice.status}
                  </span>
                </td>
                <td className="align-right">{invoice.amount}/{invoice.billing?.billingCycle}</td>
                <td className="align-right">{ getEventTimeAgo(invoice.created)}</td>
                <td className="align-right">{
                invoice.status === "active"  ?
                new Date(studio?.trialEndDate) > new Date() ?
                  getEventTimeAgo(studio?.trialEndDate):
                  getEventTimeAgo(invoice?.dates?.endDate)
                :''
                }
                </td>
                <td className="actions">
                  <Link to={invoice?.viewLink} className="link">
                    View
                  </Link>{' '}
                  |{' '}
                  <Link to={invoice?.downloadLink} className="link">
                    Download
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Invoice History Section */}
      <div className="invoice-history">
        <h2 className="section-title">Invoices</h2>
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
          {invoices.map((invoice, index) => (   
              <tr key={index}>
                <td>{invoice.id}</td>
                <td>
                  <span
                    className={`status-tag ${
                      invoice.status === 'active' ? 'paid' : 'unpaid'
                    }`}
                  >
                    {invoice.payment.status}
                  </span>
                </td>
                <td className="align-right">{invoice.pricing.totalamount}</td>
                <td className="align-right">{invoice.metadata.createdAt}</td>
                <td className="actions">
                  <Link to={'/'} className="link">
                    View
                  </Link>{' '}
                  |{' '}
                  <Link to={'/'} className="link">
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
