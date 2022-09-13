/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
import React from 'react';
import Button from 'component/button';
import moment from 'moment';
import { formatLbryUrlForWeb } from 'util/url';
import { getThumbnailFromClaim } from 'util/claim';
import ChannelThumbnail from 'component/channelThumbnail';

// eslint-disable-next-line flowtype/no-types-missing-file-annotation
type Props = {
  openModal: (string, {}) => void,
  activeChannelClaim: ?ChannelClaim,
  myPurchasedMemberships: any,
  claimsById: any,
  doMembershipMine: () => Promise<MembershipTiers>,
  doResolveClaimIds: (a: any) => void,
};

// eslint-disable-next-line flowtype/no-types-missing-file-annotation
function PledgesTab(props: Props) {
  const { myPurchasedMemberships, claimsById, doMembershipMine, doResolveClaimIds } = props;

  const [pledges, setPledges] = React.useState();
  const [resolved, setResolved] = React.useState();

  function capitalizeFirstLetter(string) {
    return string?.charAt(0).toUpperCase() + string?.slice(1);
  }

  React.useEffect(() => {
    if (myPurchasedMemberships === undefined) {
      doMembershipMine();
    }
  }, [doMembershipMine, myPurchasedMemberships]);

  React.useEffect(() => {
    if (myPurchasedMemberships) {
      const claimIds = myPurchasedMemberships.map((membership) => membership[0].MembershipDetails.channel_id);

      doResolveClaimIds(claimIds).then(() => setResolved(true));
    }
  }, [doResolveClaimIds, myPurchasedMemberships]);

  React.useEffect(() => {
    if (myPurchasedMemberships && resolved) {
      const allPledges = myPurchasedMemberships.map((active) => {
        const membership = active[0];
        const pledgeData = {};
        const fullClaim = claimsById[membership.MembershipDetails.channel_id];

        if (fullClaim?.short_url) {
          pledgeData.url = formatLbryUrlForWeb(fullClaim.short_url);
        }
        pledgeData.thumbnail = getThumbnailFromClaim(fullClaim);
        pledgeData.currency = membership.Subscription.plan.currency.toUpperCase();
        pledgeData.supportAmount = membership.Subscription.plan.amount; // in cents or 1/100th EUR
        pledgeData.period = membership.Subscription.plan.interval;

        const startDate = membership.Subscription.current_period_start * 1000;
        const endDate = membership.Subscription.current_period_end * 1000;
        const amountOfMonths = moment(endDate).diff(moment(startDate), 'months', true);
        pledgeData.timeAgo = amountOfMonths === 1 ? '1 Month' : amountOfMonths + ' Months';

        return pledgeData;
      });

      setPledges(allPledges);
    }
  }, [claimsById, myPurchasedMemberships, resolved]);

  return (
    <>
      {pledges?.length > 0 && (
        <>
          <div className="membership__mypledges-header">
            <label>My Pledges</label>
          </div>
          <div className="membership-table__wrapper">
            <table className="table table--pledges">
              <thead>
                <tr>
                  <th>Channel Name</th>
                  <th>Tier</th>
                  <th>Subscribed As</th>
                  <th>Time Total</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {myPurchasedMemberships?.map((active, i) => {
                  const membership = active[0];
                  return (
                    <tr key={i}>
                      <td>
                        <ChannelThumbnail xsmall uri={'lbry:/' + pledges[i].url} />
                        {/* <img src={pledges[i].thumbnail} style={{ maxHeight: '70px', marginRight: '13px' }} /> */}
                        <Button
                          button="link"
                          navigate={pledges[i].url + '?view=membership'}
                          label={membership.MembershipDetails.channel_name}
                        />
                      </td>
                      <td>{membership.MembershipDetails.name}</td>
                      <td>
                        {membership.Membership.channel_name === ''
                          ? __('Anonymous')
                          : membership.Membership.channel_name}
                      </td>
                      {/* TODO: add moment logic here to calculate number of months */}
                      <td>{pledges[i].timeAgo}</td>
                      <td>
                        ${pledges[i].supportAmount / 100} {pledges[i].currency} /{' '}
                        {capitalizeFirstLetter(pledges[i].period)}
                      </td>
                      <td>{membership.Subscription.status === 'active' ? __('Active') : __('Cancelled')}</td>
                      <td>
                        <span dir="auto" className="button__label">
                          <Button
                            button="primary"
                            label={__('See Details')}
                            navigate={pledges[i].url + '?view=membership'}
                          />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {myPurchasedMemberships?.length === 0 && (
        <>
          <h1 style={{ marginTop: '10px' }}> You are not currently supporting any creators </h1>

          {/* <h1 style={{ marginTop: '10px' }}> You can find some creators to support on the membership page here </h1> */}
        </>
      )}
    </>
  );
}

export default PledgesTab;
/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
