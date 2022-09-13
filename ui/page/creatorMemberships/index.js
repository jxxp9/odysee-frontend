import { connect } from 'react-redux';
import MembershipsPage from './view';
import { selectActiveChannelClaim } from 'redux/selectors/app';
import { selectAccountChargesEnabled } from 'redux/selectors/stripe';
import { doTipAccountStatus } from 'redux/actions/stripe';
import { selectMyChannelClaims } from 'redux/selectors/claims';
import { selectMyMembershipTiers } from 'redux/selectors/memberships';

const select = (state, props) => {
  const activeChannel = selectActiveChannelClaim(state);
  const myMembershipTiers = selectMyMembershipTiers(state, activeChannel?.claim_id);

  return {
    hasTiers: myMembershipTiers?.length,
    bankAccountConfirmed: selectAccountChargesEnabled(state),
    activeChannelClaim: selectActiveChannelClaim(state),
    myChannelClaims: selectMyChannelClaims(state),
  };
};

const perform = {
  doTipAccountStatus,
};

export default connect(select, perform)(MembershipsPage);
