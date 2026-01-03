import React, { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { openModal } from '../../../app/slices/modalSlice';
import { copyToClipboard, getOnboardingReferralURL } from '../../../utils/urlUtils';

export const ReferralsTab = ({ referrals }) => {
    const dispatch = useDispatch();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredReferrals = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return referrals.filter(ref => 
            (ref?.name || '').toLowerCase().includes(query) ||
            (ref?.email || '').toLowerCase().includes(query) ||
            (ref?.code?.[0] || '').toLowerCase().includes(query)
        );
    }, [referrals, searchQuery]);

    return (
        <div className="invoice-history">
            <section className="referal-codes-list">
                <div className="actions">
                    <div className="left-actions">
                        <div className="search-input-wrapper">
                            <input
                                type="text"
                                placeholder="Search referrals..."
                                className="search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button className="clear-search-button" onClick={() => setSearchQuery('')}>&times;</button>
                            )}
                        </div>
                        <div className="button secondary outline icon campaign" onClick={() => console.log('Filter campaigns')}>Campaingns</div>
                        <div className="button secondary outline icon leads" onClick={() => console.log('Filter leads')}>Leads</div>
                    </div>
                    <div className="right-actions">
                        <div className="button primary icon referal" onClick={() => dispatch(openModal('addReferral'))}>New</div>
                    </div>
                </div>
                <table className="invoice-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>User name</th>
                            <th>Email</th>
                            <th>Medium</th>
                            <th>Type</th>
                            <th>Phone</th>
                            <th>Used</th>
                            <th>Code</th>
                            <th>Send Code</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredReferrals.map((referral, index) => (
                            <tr className={`${referral?.status}`} key={index}>
                                <td>{referral?.id?.slice(0, 4)}</td>
                                <td>{referral?.name}</td>
                                <td>{referral?.email}</td>
                                <td><span className={`campainPlatform ${referral?.campainPlatform}`}></span></td>
                                <td>{referral?.type}</td>
                                <td>{referral?.studioContact}</td>
                                <td>{referral?.used}/{referral?.quota}</td>
                                <td>
                                    <span className='button icon copy' onClick={() => copyToClipboard(referral?.code?.[0])}>
                                        {referral?.code?.[0]}
                                    </span>
                                </td>
                                <td>
                                    <a 
                                        className="button secondary outline icon open-in-new"
                                        href={`https://wa.me/${referral?.phoneNumber}?text=${encodeURIComponent(getOnboardingReferralURL(referral?.code?.[0])).trim()}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={() => copyToClipboard(getOnboardingReferralURL(referral?.code?.[0]))}
                                    >
                                        Send
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
};
