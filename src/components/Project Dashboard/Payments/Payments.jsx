import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { openModal } from '../../../app/slices/modalSlice'
import { formatDecimalK } from '../../../utils/stringUtils'
import AmountCard from '../../Cards/AmountCard/AmountCard'

function DashboardPayments({project}){
  const dispatch = useDispatch()
  return (
    <div className="payments">
      <div className="heading-shoots heading-section">
        <h3 className='heading '>Invoices <span>{project.payments?project.payments.length:''}</span></h3>
        {project.payments?.length>0&&<div className="new-shoot button tertiary l2 outline"
          onClick={()=>project.budgets && dispatch(openModal('addPayment'))}
          >+ New</div>}
      </div>
      <div className={`card ${project.budgets ? '':'single'}`}>
        <div className={`chart box`}>
            <div className="status large">
              <div className="signal"></div>
            </div>
            <div className={`circle ${ !project.budgets?'gray':'green'}`}>
            {
              project.budgets && (
                <>
                {formatDecimalK(project.budgets.amount)}
                <p className="edit text">Edit</p>
                </>
              )
            } 
            </div>
          <div className="message">
          {
            project.budgets || project.budgets?.amount !==0? (
              ''
            ) :
            (
              project.payments?.length === 0 &&
              <p>Create your first invoice</p>
            )
          }
          </div>
        </div>
        {project.budgets&&<div className="payments-list">
          {
            project.payments?.length === 0? (
              <div className="no-payments">
                <div className="button secondary outline"
                onClick={()=>project.budgets && dispatch(openModal('addPayment'))}>Add Invoice</div>
              </div>
            ) : (
              <>
              {
              project.payments?.map((payment, index) => (
                <AmountCard amount={`₹${payment.amount/1000} K`} 
                project={project}
                  direction="+ " 
                  percentage={
                    payment.amount/(project.budgets.amount?project.budgets.amount*100:0)
                  } 
                    status={'confirmed'}/>
              ))}
              {/* Balance */}
              {
                (
                  <AmountCard amount={
                    `₹${(project.budgets.amount - project.payments?.reduce((a,b)=>a+b.amount,0))/1000} K`
                  } direction="- " percentage={'Balance'} status={'pending'}/>
                )
              }
              {/* Filler Cards */}
              {
                project.payments?.length<5 && (
                  Array(4-project.payments.length).fill(0).map((item, index) => (
                    <AmountCard amount={''} direction={''} percentage={''} status={'draft'}/>
                  ))
                )
              }
              </>
            )
          }
        </div>}
      </div>
    </div>
  )
}

export default DashboardPayments
// Line Complexity  1.0 -> 0.9