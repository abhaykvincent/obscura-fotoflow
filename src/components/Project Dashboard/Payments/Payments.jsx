import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { openModal } from '../../../app/slices/modalSlice'
import { formatDecimalK } from '../../../utils/stringUtils'
import AmountCard from '../../Cards/AmountCard/AmountCard'

function DashboardPayments({ project }) {
  const dispatch = useDispatch()
  
  const totalPayments = project.payments?.reduce((acc, payment) => acc + payment?.amount, 0) || 0
  const percentage = project.budgets ? (totalPayments / project.budgets.amount) * 100 : 0
  
  return (
    <div className="payments">
      <div className="heading-shoots heading-section hjkk">
        <h3 className='heading hjkk'>Invoices <span>{project.payments ? project.payments.length : ''}</span></h3>
        {project.payments?.length > 0 &&
          
          <div className="new-shoot button tertiary l2 outline icon new"
            onClick={() => project.budgets && dispatch(openModal('addPayment'))}
          >New</div>
        }
      </div>
      <div className={`card ${project.budgets ? '' : 'single'}`}>
        <div className="chart box">
          <div className="status large">
            <div className="signal"></div>
          </div>
          <div className={`ring-chart ${!project.budgets ? 'gray' : 'green'}`}>
            <svg width="88" height="88" viewBox="0 0 36 36" className="circular-chart">
              <path className="circle-bg"
                d="M18 2.0845
                   a 15.9155 15.9155 0 0 1 0 31.831
                   a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#333"
                strokeWidth="2"
              />
              {project.budgets && (
                <path className="circle"
                  strokeDasharray={`${percentage}, 100`}
                  d="M18 2.0845
                     a 15.9155 15.9155 0 0 1 0 31.831
                     a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                strokeLinecap='round'
                  stroke="#4caf50"
                  strokeWidth="2"
                />
              )}
              <g
              >

              <text x="10" y="18" className="amount highlight">{totalPayments && formatDecimalK(totalPayments)}</text>
              <text x="12" y="24" className="amount">/ {formatDecimalK(project.budgets?.amount ? project.budgets?.amount:0)}</text>
              </g>
            </svg>
          </div>
          <div className="message">
            {!project.budgets
              ? (
                <div className="button primary outline"
                  onClick={() => dispatch(openModal('addBudget'))}
                >
                  Set Budget
                </div>
              )
              : (
                <div className="legend">
                  <p className="paid">Paid</p>
                  <p className="pending">Pending</p>
                </div>
              )
            }
          </div>
        </div>
        {project.budgets && <div className="payments-list">
          {
            project.payments?.length === 0 ? (
              <div className="no-payments">
                <div className="button secondary outline"
                  onClick={() => project.budgets && dispatch(openModal('addPayment'))}>Add Invoice</div>
              </div>
            ) : (
              <>
                {project.payments?.map((payment, index) => (
                  <AmountCard
                    key={index}
                    amount={`₹ ${payment.amount / 1000} K`}
                    project={project}
                    direction="+ "
                    percentage={payment.amount / (project.budgets.amount ? project.budgets.amount * 100 : 0)}
                    status={'confirmed'}
                  />
                ))}
                {/* Balance */}
                <AmountCard
                  amount={`₹ ${(project.budgets.amount - totalPayments) / 1000} K`}
                  direction="- "
                  percentage={'Balance'}
                  status={'pending'}
                />
                {/* Filler Cards */}
                {project.payments?.length < 5 && (
                  Array(4 - project.payments.length).fill(0).map((_, index) => (
                    <AmountCard key={index} amount={''} direction={''} percentage={''} status={'draft'} />
                  ))
                )}
              </>
            )
          }
        </div>}
      </div>
    </div>
  )
}

export default DashboardPayments
