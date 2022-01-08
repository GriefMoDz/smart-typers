const { React, getModule, getAllModules, getModuleByDisplayName } = require('powercord/webpack');

const Avatar = getModule([ 'AnimatedAvatar' ], false);
const Popout = getModuleByDisplayName('Popout', false);
const Tooltip = getModuleByDisplayName('Tooltip', false);
const DiscordTag = getModuleByDisplayName('DiscordTag', false);
const VoiceUserSummaryItem = getModuleByDisplayName('VoiceUserSummaryItem', false);
const preloadUserProfile = getAllModules(m => typeof m?.default === 'function' &&
  m.default.toString().match(/^function\(e,t,r\){return \w+.apply.+\)}$/), false)[1].default;

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

  renderTypingUser (user, className) {
    if (!user) {
      return null;
    }

    if (this.props.main.settings.get('userPopout')) {
      return React.createElement(Popout, {
        preload: () => preloadUserProfile(user.id, user.getAvatarURL(this.props.channel.guild_id, 80, { guildId: this.props.channel.guild_id })),
        renderPopout: (props) => this.props.main.renderUserPopout(user, props),
        position: Popout.Positions.BOTTOM
      }, (popoutProps) => React.createElement(Tooltip, {
        text: React.createElement(DiscordTag, {
          user,
          nick: this.props.main.modules.usernameUtils.getNickname(this.props.channel.guild_id, this.props.channel.id, user)
        }),
        'aria-label': user.tag
      }, (tooltipProps) => React.createElement(Avatar.default, Object.assign({}, {
        ...tooltipProps,
        className,
        src: user.getAvatarURL(),
        size: Avatar.default.Sizes.SIZE_16,
        onClick: (e) => e.shiftKey ? this.props.main.handleUserClick(user, this.props.channel, e) : popoutProps.onClick(e),
        onContextMenu: (e) => this.props.main.openUserContextMenu(user, this.props.channel.guild_id, this.props.channel, e)
      }, _.omit(popoutProps, 'onClick')))));
    }

    return React.createElement(Tooltip, {
      text: React.createElement(DiscordTag, {
        user,
        nick: this.props.main.modules.usernameUtils.getNickname(this.props.channel.guild_id, this.props.channel.id, user)
      }),
      'aria-label': user.tag
    }, (tooltipProps) => React.createElement(Avatar.default, {
      ...tooltipProps,
      className,
      src: user.getAvatarURL(),
      size: Avatar.default.Sizes.SIZE_16,
      onClick: (e) => e.shiftKey && this.props.main.handleUserClick(user, this.props.channel, e),
      onContextMenu: (e) => this.props.main.openUserContextMenu(user, this.props.channel.guild_id, this.props.channel, e)
    }));
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
