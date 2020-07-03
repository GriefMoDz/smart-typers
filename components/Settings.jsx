const { React } = require('powercord/webpack');
const { FormTitle, Flex, Button } = require('powercord/components');
const { SwitchItem } = require('powercord/components/settings');

const Preview = require('./Preview');
const TextInputWithButton = require('./TextInputWithButton');

module.exports = class Settings extends React.PureComponent {
  constructor (props) {
    super(props);

    this.state = {
      showVariables: false
    };
  }

  render () {
    return <>
      <FormTitle>Preview</FormTitle>
      <Preview {...this.props } />

      <FormTitle tag='h2' className='smartTypers-title'>Settings</FormTitle>
      {this.renderSettings()}
    </>;
  }

  renderSettings () {
    const { getSetting, toggleSetting, updateSetting } = this.props;

    return <>
      <FormTitle>Appearance</FormTitle>
      <SwitchItem
        note='Filters out emojis from display names (will automatically fallback to username, if a nickname is set and it only contains emojis).'
        value={getSetting('hideEmojis', false)}
        onChange={() => toggleSetting('hideEmojis')}
      >
        Hide Emojis
      </SwitchItem>
      <SwitchItem
        note={'Displays a colored gradient over display names by using the color of the user\'s highest role.'}
        value={getSetting('colorGradient', false)}
        onChange={() => toggleSetting('colorGradient')}
      >
        Colored Gradient
      </SwitchItem>
      <TextInputWithButton
        defaultValue={getSetting('userFormat', '{displayName}')}
        onChange={(value) => updateSetting('userFormat', value)}
        onClick={() => this.setState({ showVariables: !this.state.showVariables })}
        title={[ 'User Format', <div className='smartTypers-beta'>Beta</div> ]}
        text={`${this.state.showVariables ? 'Hide' : 'Show'} Variables`}
      >
        {this.state.showVariables && <Flex>
          {[ 'username', 'displayName', 'discriminator', 'tag', 'id' ].map(variable => (
            <Button
              className='smartTypers-variable'
              look={Button.Looks.GHOST}
              size={Button.Sizes.MIN}
              onClick={() => {
                let currentUserFormat = getSetting('userFormat', '{displayName}');
                const userFormat = currentUserFormat += `{${variable}}`;

                updateSetting('userFormat', userFormat);
              }}
            >
              {`{${variable}}`}
            </Button>
          ))}
        </Flex>}
      </TextInputWithButton>

      <FormTitle>Functionality</FormTitle>
      <SwitchItem
        note='Renders a popout that shows basic information about the selected user and provides some additional prompts.'
        value={getSetting('userPopout', true)}
        onChange={() => toggleSetting('userPopout')}
      >
        User Popout
      </SwitchItem>
      <SwitchItem
        note='Renders a context menu that features a variety of actions for managing the targeted user.'
        value={getSetting('userContextMenu', true)}
        onChange={() => toggleSetting('userContextMenu')}
      >
        User Context Menu
      </SwitchItem>
    </>;
  }
};
