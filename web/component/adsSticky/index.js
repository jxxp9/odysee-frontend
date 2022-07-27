import { connect } from 'react-redux';
import AdsSticky from './view';
import { doSetAdBlockerFound } from 'redux/actions/app';
import { selectClaimForUri } from 'redux/selectors/claims';
import { selectAdBlockerFound } from 'redux/selectors/app';
import { selectHomepageData } from 'redux/selectors/settings';
import {
  selectOdyseeMembershipIsPremiumPlus,
  selectUserCountry,
  selectUserVerifiedEmail,
  selectUserLocale,
} from 'redux/selectors/user';
import { isChannelClaim, isStreamPlaceholderClaim } from 'util/claim';
import { selectAnyNagsShown } from 'redux/selectors/notifications';

const select = (state, props) => {
  const claim = selectClaimForUri(state, props.uri);

  return {
    isContentClaim: isStreamPlaceholderClaim(claim) || Boolean(claim?.value?.source?.media_type),
    isChannelClaim: isChannelClaim(claim),
    authenticated: selectUserVerifiedEmail(state),
    isAdBlockerFound: selectAdBlockerFound(state),
    userHasPremiumPlus: selectOdyseeMembershipIsPremiumPlus(state),
    userCountry: selectUserCountry(state),
    homepageData: selectHomepageData(state),
    locale: selectUserLocale(state),
    nagsShown: selectAnyNagsShown(state),
  };
};

const perform = {
  doSetAdBlockerFound,
};

export default connect(select, perform)(AdsSticky);
