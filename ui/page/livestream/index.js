import { connect } from 'react-redux';
import { makeSelectTagInClaimOrChannelForUri, selectClaimForUri } from 'redux/selectors/claims';
import { doSetPrimaryUri } from 'redux/actions/content';
import { doUserSetReferrer } from 'redux/actions/user';
import { selectUserVerifiedEmail } from 'redux/selectors/user';
import { DISABLE_COMMENTS_TAG } from 'constants/tags';
import { doCommentSocketConnect } from 'redux/actions/websocket';
import { getChannelIdFromClaim } from 'util/claim';
import {
  selectActiveLivestreamForChannel,
  selectActiveLivestreamInitialized,
  selectCommentSocketConnected,
} from 'redux/selectors/livestream';
import { doFetchChannelLiveStatus } from 'redux/actions/livestream';
import LivestreamPage from './view';

const select = (state, props) => {
  const { uri } = props;
  const channelClaimId = getChannelIdFromClaim(selectClaimForUri(state, uri));

  return {
    isAuthenticated: selectUserVerifiedEmail(state),
    channelClaimId,
    chatDisabled: makeSelectTagInClaimOrChannelForUri(uri, DISABLE_COMMENTS_TAG)(state),
    activeLivestreamForChannel: selectActiveLivestreamForChannel(state, channelClaimId),
    activeLivestreamInitialized: selectActiveLivestreamInitialized(state),
    socketConnected: selectCommentSocketConnected(state),
  };
};

const perform = {
  doSetPrimaryUri,
  doUserSetReferrer,
  doCommentSocketConnect,
  doFetchChannelLiveStatus,
};

export default connect(select, perform)(LivestreamPage);
