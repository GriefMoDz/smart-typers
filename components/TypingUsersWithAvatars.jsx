const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');

const Avatar = getModule([ 'AnimatedAvatar' ], false);
const Tooltip = getModuleByDisplayName('Tooltip', false);
const DiscordTag = getModuleByDisplayName('DiscordTag', false);
const VoiceUserSummaryItem = getModuleByDisplayName('VoiceUserSummaryItem', false);

module.exports = class TypingUsers extends React.PureComponent {
  render () {
    const { main } = this.props;

    return [ React.createElement(VoiceUserSummaryItem, {
      className: 'typing-users',
      users: this.props.typingUsers,
      renderUser: this.renderTypingUser.bind(this),
      renderMoreUsers: this.renderTypingUsers.bind(this),
      max: main.settings.get('maxTypingUsers', -1) + 1
    }), this.props.children ];
  }

  renderTypingUser (...args) {
    // eslint-disable-next-line multiline-ternary
    return args[0] ? React.createElement(Tooltip, {
      text: React.createElement(DiscordTag, {
        user: args[0],
        nick: this.props.main.modules.usernameUtils.getNickname(this.props.channel.guild_id, this.props.channel.id, args[0])
      }),
      'aria-label': args[0].tag
    }, (props) => React.createElement(Avatar.default, {
      ...props,
      src: args[0].getAvatarURL(),
      className: args[1],
      size: Avatar.default.Sizes.SIZE_16,
      onClick: (e) => this.props.main.handleUserClick(args[0], this.props.channel, e),
      onContextMenu: (e) => this.props.main.openUserContextMenu(args[0], this.props.channel.guild_id, this.props.channel, e)
    })) : null;
  }

  renderTypingUsers (...args) {
    const maxTypingUsers = this.props.main.settings.get('maxTypingUsers', -1);
    const additionalUsers = this.props.typingUsers.slice(maxTypingUsers, this.props.typingUsers.length);

    return React.createElement(Tooltip, {
      tooltipContentClassName: 'smartTypers-moreUsers',
      text: additionalUsers.map((user, index) => [ React.createElement(DiscordTag, {
        user,
        nick: this.props.main.modules.usernameUtils.getNickname(this.props.channel.guild_id, this.props.channel.id, user)
      }), index !== (additionalUsers.length - 1) ? React.createElement('span', {}, ',\u00A0') : null ])
    }, (props) => React.createElement('div', {
      ...props,
      className: args[1]
    }, `+${additionalUsers.length}`));
  }
};
