// @flow
import React from 'react';
import ChannelThumbnail from 'component/channelThumbnail';

export default function SupportersTab() {
  // TODO: replace with API call
  const yourSupporters = [
    {
      channelName: '@test35234',
      tierName: 'Community MVP',
      supportAmountPerMonth: '20',
      currency: 'USD',
      monthsOfSupport: 2,
    },
  ];

  return (
    <div className="membership-table__wrapper">
      <table className="table">
        <thead>
          <tr>
            <th className="date-header">Channel Name</th>
            <th className="channelName-header">Tier</th>
            <th className="location-header">Amount</th>
            <th className="amount-header">Joined On</th>
            <th className="channelName-header">Membership Length</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {yourSupporters.map((supporter, i) => (
              <>
                <td>
                  <span dir="auto" className="button__label">
                    {false && <ChannelThumbnail xsmall uri={channelClaim.canonical_url} />}
                    @test35234
                  </span>
                </td>
                <td>Community MVP</td>
                <td>$20 USD / Month</td>
                <td>March 19, 2022</td>
                <td>2 Months</td>
              </>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
