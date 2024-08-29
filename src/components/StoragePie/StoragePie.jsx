import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { openModal } from '../../app/slices/modalSlice'
import AmountCard from '../Cards/AmountCard/AmountCard'

function DashboardPayments({ project }) {
  const dispatch = useDispatch()

  const totalBudget = project.budgets?.amount || 0
  const totalPayments = project.payments?.reduce((a, b) => a + b.amount, 0) || 0
  const usedPercentage = (totalPayments / totalBudget) * 100
  const [currentUsedPercentage, setCurrentUsedPercentage] = useState(0)

  useEffect(() => {
    setTimeout(() => {
      setCurrentUsedPercentage(usedPercentage)
    }, 200)
  }, [usedPercentage])

  const circumference = 2 * Math.PI * 40 // Assuming a radius of 40
  const dasharray = `${circumference} ${circumference}`
  const dashoffset = circumference - (currentUsedPercentage / 100) * circumference

  return (
    <div className="payments">
      <div className="heading-shoots heading-section hjkk">
        <h3 className="heading hjkk">Invoices <span>{project.payments ? project.payments.length : ''}</span></h3>
        {project.payments?.length > 0 &&
          <div className="new-shoot button tertiary l2 outline icon new"
            onClick={() => project.budgets && dispatch(openModal('addPayment'))}
          >New</div>
        }
      </div>
      <div className={`card ${project.budgets ? '' : 'single'}`}>
        <div className={`chart box`}>
          <div className="status large">
            <div className="signal"></div>
          </div>
          <div className="ring-chart">
            <svg className={`${project.budgets ? '' : 'disabled'}`} width="100" height="100" viewBox="0 0 100 100">
              <circle
                className="available-budget"
                cx="50"
                cy="50"
                r="40"
                fill="none"
                strokeWidth="6"
              />
              <circle
                className="used-budget"
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#2ecc71" // Green color for the used budget
                strokeWidth="5"
                strokeDasharray={dasharray}
                strokeDashoffset={dashoffset}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
              <text className="budget-text" x="50" y="55" textAnchor="middle" dy="0.3em" fill="#2ecc71">
                {`${currentUsedPercentage.toFixed(1)}%`}
              </text>
            </svg>
          </div>
          <div className="message">
            {!project.budgets ? (
              <div className="button primary outline"
                onClick={() => dispatch(openModal('addBudget'))}
              >
                Set Budget
              </div>
            ) :
              (
                project.payments?.length === 0 &&
                <p>Create Invoice</p>
              )
            }
          </div>
        </div>
        {project.budgets && <div className="payments-list">
          {project.payments?.length === 0 ? (
            <div className="no-payments">
              <div className="button secondary outline"
                onClick={() => project.budgets && dispatch(openModal('addPayment'))}>Add Invoice</div>
            </div>
          ) : (
            <>
              {project.payments?.map((payment, index) => (
                <AmountCard
                  key={index}
                  amount={`₹${payment.amount / 1000} K`}
                  project={project}
                  direction="+ "
                  percentage={payment.amount / (project.budgets.amount ? project.budgets.amount * 100 : 0)}
                  status={'confirmed'}
                />
              ))}
              {/* Balance */}
              {
                <AmountCard
                  amount={`₹${(project.budgets.amount - project.payments?.reduce((a, b) => a + b.amount, 0)) / 1000} K`}
                  direction="- "
                  percentage={'Balance'}
                  status={'pending'}
                />
              }
              {/* Filler Cards */}
              {
                project.payments?.length < 5 && (
                  Array(4 - project.payments.length).fill(0).map((item, index) => (
                    <AmountCard key={index} amount={''} direction={''} percentage={''} status={'draft'} />
                  ))
                )
              }
            </>
          )}
        </div>}
      </div>
    </div>
  )
}

export default DashboardPayments
