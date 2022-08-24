import { connect } from 'react-redux';
import { selectClaimForUri, selectClaimIsMine } from 'redux/selectors/claims';
import ProtectedContentOverlay from './view';
import { selectProtectedContentMembershipsForClaimId, selectMyActiveMembershipIds } from 'redux/selectors/memberships';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);
  const claimId = claim && claim.claim_id;
  const channelId = claim && claim?.signing_channel?.claim_id;

  return {
    claimIsMine: selectClaimIsMine(state),
    claim,
    protectedMembershipIds: selectProtectedContentMembershipsForClaimId(state, channelId, claimId),
    activeMembershipIds: selectMyActiveMembershipIds(state),
  };
};

export default connect(select, null)(ProtectedContentOverlay);
