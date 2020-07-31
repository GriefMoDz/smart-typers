const { React, i18n: { _proxyContext: { defaultMessages }, Messages } } = require('powercord/webpack');
const { FormTitle, Flex, Button } = require('powercord/components');
const { SwitchItem, SliderInput } = require('powercord/components/settings');

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
      <FormTitle>{Messages.FORM_LABEL_VIDEO_PREVIEW}</FormTitle>
      <Preview {...this.props } />

      <FormTitle tag='h2' className='smartTypers-title'>{Messages.SETTINGS}</FormTitle>
      {this.renderSettings()}
    </>;
  }

  renderSettings () {
    const { getSetting, toggleSetting, updateSetting } = this.props;

    return <>
      <FormTitle>{Messages.APPEARANCE}</FormTitle>
      <SwitchItem
        note={Messages.SMART_TYPERS.HIDE_EMOJIS_DESC}
        value={getSetting('hideEmojis', false)}
        onChange={() => toggleSetting('hideEmojis')}
      >
        {Messages.SMART_TYPERS.HIDE_EMOJIS}
      </SwitchItem>
      <SwitchItem
        note={Messages.SMART_TYPERS.COLORED_GRADIENT_DESC}
        value={getSetting('colorGradient', false)}
        onChange={() => toggleSetting('colorGradient')}
      >
        {Messages.SMART_TYPERS.COLORED_GRADIENT}
      </SwitchItem>
      <SwitchItem
        note={Messages.SMART_TYPERS.DISABLE_INDICATOR_DESC}
        value={getSetting('disableIndicator', false)}
        onChange={() => toggleSetting('disableIndicator')}
      >
        {Messages.SMART_TYPERS.DISABLE_INDICATOR}
      </SwitchItem>
      <SliderInput
        stickToMarkers
        initialValue={getSetting('maxTypingUsers', 3)}
        markers={[ 3, 4, 5, 6, 7, 8 ]}
        className='smartTypers-slider'
        onMarkerRender={marker => `${marker} ${Messages.SMART_TYPERS.USERS}`}
        defaultValue={getSetting('maxTypingUsers', 3)}
        onValueChange={value => updateSetting('maxTypingUsers', value)}
      >
        {Messages.SMART_TYPERS.MAXIMUM_TYPING_USERS}
      </SliderInput>
      <TextInputWithButton
        defaultValue={getSetting('typingFormat', defaultMessages.SMART_TYPERS.TYPING_FORMAT_PLACEHOLDER)}
        placeholder={defaultMessages.SMART_TYPERS.TYPING_FORMAT_PLACEHOLDER}
        onChange={(value) => updateSetting('typingFormat', value)}
        onClick={() => updateSetting('typingFormat', defaultMessages.SMART_TYPERS.TYPING_FORMAT_PLACEHOLDER)}
        title={Messages.SMART_TYPERS.TYPING_FORMAT}
        text={Messages.SMART_TYPERS.SET_AS_DEFAULT}
        icon='fal fa-undo'
      />
      <TextInputWithButton
        defaultValue={getSetting('userFormat', '**{displayName}**')}
        placeholder='**{displayName}**'
        onChange={(value) => updateSetting('userFormat', value)}
        onClick={() => this.setState({ showVariables: !this.state.showVariables })}
        title={[ Messages.SMART_TYPERS.USER_FORMAT, <div className='smartTypers-beta'>{Messages.SMART_TYPERS.BETA}</div> ]}
        text={Messages.SMART_TYPERS[`${this.state.showVariables ? 'HIDE' : 'SHOW'}_VARIABLES`]}
        icon='fal fa-brackets-curly'
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

      <FormTitle style={{ marginTop: 40 }}>{Messages.SMART_TYPERS.FUNCTIONALITY}</FormTitle>
      <SwitchItem
        note={Messages.SMART_TYPERS.USER_POPOUT_DESC}
        value={getSetting('userPopout', true)}
        onChange={() => toggleSetting('userPopout')}
      >
        {Messages.SMART_TYPERS.USER_POPOUT}
      </SwitchItem>
      <SwitchItem
        note={Messages.SMART_TYPERS.USER_CONTEXT_MENU_DESC}
        value={getSetting('userContextMenu', true)}
        onChange={() => toggleSetting('userContextMenu')}
      >
        {Messages.SMART_TYPERS.USER_CONTEXT_MENU}
      </SwitchItem>
      <SwitchItem
        note={Messages.SMART_TYPERS.USER_SHIFT_CLICK_DESC}
        value={getSetting('userShiftClick', true)}
        onChange={() => toggleSetting('userShiftClick')}
      >
        {Messages.SMART_TYPERS.USER_SHIFT_CLICK}
      </SwitchItem>
    </>;
  }
};
