const { React, i18n, i18n: { Messages }, getModuleByDisplayName } = require('powercord/webpack');
const { AsyncComponent, FormTitle, Flex, Button } = require('powercord/components');
const { SwitchItem, SliderInput } = require('powercord/components/settings');

const Preview = require('./Preview');
const TextInputWithButton = require('./TextInputWithButton');
const KeyboardShortcut = AsyncComponent.from(getModuleByDisplayName('KeyboardShortcut'));

module.exports = class Settings extends React.PureComponent {
  constructor (props) {
    super(props);

    this.state = {
      showVariables: false
    };

    this.checkForOverrides = () => {
      const settingsTabs = powercord.api.settings.tabs;
      const hasRoleColorEverywhere = settingsTabs.hasOwnProperty('rceverywhere');
      if (hasRoleColorEverywhere) {
        const tab = settingsTabs.rceverywhere;
        const fluxProps = powercord.api.settings._fluxProps(tab.category);
        if (fluxProps.getSetting('typing', true)) {
          powercord.api.settings._fluxProps(tab.category).updateSetting('typing', false);
        }
      }
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
    const i18nContextProvider = i18n._provider?._context || i18n._proxyContext;

    return <>
      <FormTitle>{Messages.APPEARANCE}</FormTitle>
      <SwitchItem
        note={Messages.SMART_TYPERS.USER_AVATARS_DESC}
        value={getSetting('userAvatars', false)}
        onChange={() => toggleSetting('userAvatars', false)}
      >
        {Messages.SMART_TYPERS.USER_AVATARS}
        <div className='smartTypers-beta'>Beta</div>
      </SwitchItem>
      <SwitchItem
        note={Messages.SMART_TYPERS.HIDE_EMOJIS_DESC}
        value={getSetting('hideEmojis', false)}
        onChange={() => toggleSetting('hideEmojis', false)}
        disabled={getSetting('userAvatars', false)}
      >
        {Messages.SMART_TYPERS.HIDE_EMOJIS}
      </SwitchItem>
      <SwitchItem
        note={Messages.SMART_TYPERS.COLORED_GRADIENT_DESC}
        value={getSetting('colorGradient', false)}
        onChange={(checked) => {
          if (checked) {
            this.checkForOverrides();
          }

          return toggleSetting('colorGradient', false);
        }}
        disabled={getSetting('userAvatars', false)}
      >
        {Messages.SMART_TYPERS.COLORED_GRADIENT}
      </SwitchItem>
      <SwitchItem
        note={Messages.SMART_TYPERS.DISABLE_INDICATOR_DESC}
        value={getSetting('disableIndicator', false)}
        onChange={() => toggleSetting('disableIndicator', false)}
      >
        {Messages.SMART_TYPERS.DISABLE_INDICATOR}
      </SwitchItem>
      <SwitchItem
        note={Messages.SMART_TYPERS.SELF_TYPING_DESC}
        value={getSetting('selfTyping', false)}
        onChange={() => toggleSetting('selfTyping', false)}
        disabled
      >
        {Messages.SMART_TYPERS.SELF_TYPING}
        <div className='smartTypers-beta'>Temporarily Disabled</div>
      </SwitchItem>
      <SwitchItem
        note={Messages.SMART_TYPERS.CONVERT_UNICODE_EMOJIS_DESC}
        value={getSetting('convertUnicodeEmojis', true)}
        onChange={() => toggleSetting('convertUnicodeEmojis', true)}
      >
        {Messages.SMART_TYPERS.CONVERT_UNICODE_EMOJIS}
      </SwitchItem>
      <SliderInput
        stickToMarkers
        initialValue={getSetting('maxTypingUsers', 3)}
        markers={[ 3, 4, 5, 6, 7, 8 ]}
        className='smartTypers-slider'
        onMarkerRender={marker => marker === 3 ? Messages.DEFAULT : Messages.NUM_USERS.format({ num: marker })}
        defaultValue={getSetting('maxTypingUsers', 3)}
        onValueChange={value => updateSetting('maxTypingUsers', value)}
      >
        {Messages.SMART_TYPERS.MAXIMUM_TYPING_USERS}
      </SliderInput>
      <TextInputWithButton
        defaultValue={getSetting('typingFormat', i18nContextProvider.defaultMessages.SMART_TYPERS.TYPING_FORMAT_PLACEHOLDER)}
        placeholder={i18nContextProvider.defaultMessages.SMART_TYPERS.TYPING_FORMAT_PLACEHOLDER}
        onChange={(value) => updateSetting('typingFormat', value)}
        buttonOnClick={() => updateSetting('typingFormat', i18nContextProvider.defaultMessages.SMART_TYPERS.TYPING_FORMAT_PLACEHOLDER)}
        title={Messages.SMART_TYPERS.TYPING_FORMAT}
        buttonText={Messages.SMART_TYPERS.SET_AS_DEFAULT}
        buttonIcon='fal fa-undo'
      />
      <TextInputWithButton
        defaultValue={getSetting('userFormat', '**{displayName}**')}
        placeholder='**{displayName}**'
        onChange={(value) => updateSetting('userFormat', value)}
        buttonOnClick={() => this.setState({ showVariables: !this.state.showVariables })}
        title={[ Messages.SMART_TYPERS.USER_FORMAT, <div className='smartTypers-beta'>{Messages.BETA}</div> ]}
        buttonText={Messages.SMART_TYPERS[`${this.state.showVariables ? 'HIDE' : 'SHOW'}_VARIABLES`]}
        buttonIcon='fal fa-brackets-curly'
        disabled={getSetting('userAvatars', false)}
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
        onChange={() => toggleSetting('userPopout', true)}
      >
        {Messages.SMART_TYPERS.USER_POPOUT}
      </SwitchItem>
      <SwitchItem
        note={Messages.SMART_TYPERS.USER_CONTEXT_MENU_DESC}
        value={getSetting('userContextMenu', true)}
        onChange={() => toggleSetting('userContextMenu', true)}
      >
        {Messages.SMART_TYPERS.USER_CONTEXT_MENU}
      </SwitchItem>
      <SwitchItem
        note={Messages.SMART_TYPERS.USER_SHIFT_CLICK_DESC.format({
          shiftHook: (_, text) => React.createElement(KeyboardShortcut, {
            shortcut: 'shift',
            className: 'smartTypers-keybind'
          }, text)
        })}
        value={getSetting('userShiftClick', true)}
        onChange={() => toggleSetting('userShiftClick', true)}
      >
        {Messages.SMART_TYPERS.USER_SHIFT_CLICK}
      </SwitchItem>
    </>;
  }
};
