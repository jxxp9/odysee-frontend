// @flow
import React from 'react';

import * as ICONS from 'constants/icons';

import Button from 'component/button';
import MembershipDetails from '../membershipDetails';

type Props = {
  key?: any,
  membership: CreatorMembership,
  channelIsMine: boolean,
  handleSelect: () => void,
};

const MembershipBlock = (props: Props) => {
  const { key, membership, channelIsMine, handleSelect } = props;

  const [blockExpanded, setBlockExpanded] = React.useState(false);

  function handleShowMore(e: Event) {
    setBlockExpanded(true);

    const showMoreButton = e.currentTarget;
    // $FlowFixMe
    const parentNode = showMoreButton.parentNode;
    setTimeout(() => parentNode.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
  }

  return (
    <div key={key} className="join-membership__block">
      <MembershipDetails
        membership={membership}
        headerAction={
          <Button
            icon={ICONS.UPGRADE}
            button="primary"
            disabled={channelIsMine}
            label={__('Signup for $%membership_price% a month', {
              membership_price: membership.NewPrices[0].Price.amount / 100,
            })}
            onClick={handleSelect}
          />
        }
        expanded={blockExpanded}
      />

      {false && !blockExpanded && (
        <Button
          button="link"
          className="button--membership-tier__show-more"
          label={__('SHOW MORE')}
          onClick={handleShowMore}
        />
      )}
    </div>
  );
};

export default MembershipBlock;
