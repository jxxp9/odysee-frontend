import { connect } from 'react-redux';
import {
  doSendTip,
  makeSelectTitleForUri,
  makeSelectClaimForUri,
  selectIsSendingSupport,
  selectBalance,
} from 'lbry-redux';
import WalletSendTip from './view';

const select = (state, props) => ({
  isPending: selectIsSendingSupport(state),
  title: makeSelectTitleForUri(props.uri)(state),
  claim: makeSelectClaimForUri(props.uri)(state),
  balance: selectBalance(state),
});

const perform = dispatch => ({
  sendSupport: (amount, claimId) => dispatch(doSendTip(amount, claimId)),
});

export default connect(
  select,
  perform
)(WalletSendTip);
