const { Plugin } = require('powercord/entities');
const { React, getModuleByDisplayName, getModule, contextMenu, i18n: { _proxyContext: { defaultMessages }, Messages }, constants } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');

const Settings = require('./components/Settings');
const i18n = require('./i18n');

const { TooltipContainer } = getModule(m => m.TooltipContainer, false);

module.exports = class SmartTypers extends Plugin {
  constructor () {
    super();

    this.parser = getModule([ 'parse', 'parseTopic' ], false);
  }

  get currentUserId () {
    return window.DiscordNative.crashReporter.getMetadata().user_id;
  }

  async startPlugin () {
    this.loadStylesheet('style.css');
    powercord.api.i18n.loadAllStrings(i18n);
    powercord.api.settings.registerSettings(this.entityID, {
      category: this.entityID,
      label: 'Smart Typers',
      render: (props) => React.createElement(Settings, {
        main: this,
        ...props
      })
    });

    const getSetting = (setting, defaultValue) => this.settings.get(setting, defaultValue);

    const relationshipStore = await getModule([ 'getRelationships' ]);
    const memberStore = await getModule([ 'initialize', 'getMember' ]);
    const userStore = await getModule([ 'getCurrentUser' ]);
    const usernameUtils = await getModule([ 'getName' ]);
    const i18nParser = await getModule([ 'getMessage' ]);

    const _this = this;
    const TypingUsers = (await getModuleByDisplayName('FluxContainer(TypingUsers)')).prototype.render.call({ memoizedGetStateFromStores: () => ({}) }).type;
    inject('smartTypers-popouts', TypingUsers.prototype, 'render', function (args, res) {
      if (res) {
        const maxTypingUsers = getSetting('maxTypingUsers', 3);

        const twoUsersTyping = Messages.TWO_USERS_TYPING.plainFormat({ a: null, b: null });
        const typingMessage = twoUsersTyping.replace(/[*]{2}.+[*]{2}/, '');
        const [ , and ] = twoUsersTyping.match(/[*]{2}\s(.+)\s[*]{2}/);

        /* Additional Users */
        const filteredUserIds = Object.keys(this.props.typingUsers)
          .filter(id => id !== _this.currentUserId)
          .filter(id => !relationshipStore.isBlocked(id));

        if (filteredUserIds.length > 3 && maxTypingUsers > 3) {
          let typingUsers = '';
          const formatKeys = {
            additionalUsers: filteredUserIds.length - maxTypingUsers
          };

          for (let i = 0; i < filteredUserIds.length; i++) {
            const letter = String.fromCharCode(i + 97);
            const currentIndex = i + 1;

            if (currentIndex <= maxTypingUsers) {
              if (currentIndex >= filteredUserIds.length) {
                typingUsers += `${and} **!!${letter}!!**`;
              } else {
                typingUsers += `**!!${letter}!!**, `;
              }

              formatKeys[letter] = null;
            } else {
              typingUsers = typingUsers.replace(/,.$/, ` ${and} {additionalUsers, number} other user${formatKeys.additionalUsers > 1 ? 's' : ''}`);
            }
          }

          Messages.SMART_TYPERS.CUSTOM_USERS_TYPING = i18nParser.getMessage(`${typingUsers} ${typingMessage}`);

          res.props.children[1].props.children = Messages.SMART_TYPERS.CUSTOM_USERS_TYPING.format(formatKeys);
        }

        /* Custom Typing Format */
        const typingFormat = getSetting('typingFormat', '');
        if (typingFormat.length > 0 && typingFormat !== defaultMessages.SMART_TYPERS.TYPING_FORMAT_PLACEHOLDER && filteredUserIds.length > 0) {
          const { children } = res.props.children[1].props;

          const parsedFormat = i18nParser.getMessage(typingFormat);
          const replacement = ` ${typeof parsedFormat.format === 'function'
            ? parsedFormat.format({ typingUsers: filteredUserIds.length })
            : parsedFormat}`;

          if (Array.isArray(children)) {
            children[children.length - 1] = filteredUserIds.length > maxTypingUsers
              ? children[children.length - 1].replace(typingMessage, replacement)
              : replacement;
          } else {
            res.props.children[1].props.children = Messages.SEVERAL_USERS_TYPING.replace(typingMessage, replacement);
          }
        }

        /* Additional Users Tooltip */
        if (maxTypingUsers > 3 && filteredUserIds.length > maxTypingUsers) {
          const { children } = res.props.children[1].props;
          const additionalUsers = filteredUserIds.slice(maxTypingUsers, filteredUserIds.length).map(userId => {
            const user = userStore.getUser(userId);
            const displayName = usernameUtils.getName(this.props.channel.guild_id, this.props.channel.id, user);
            return _this.parseUser(user, displayName);
          });

          children[children.length - 1] = React.createElement(TooltipContainer, {
            text: additionalUsers.join(', '),
            element: 'span'
          }, children[children.length - 1]);
        }

        for (let i = 0; i < filteredUserIds.length; i++) {
          const userId = filteredUserIds[i];
          const guildId = this.props.channel.guild_id;
          const userElement = res.props.children[1].props.children[i * 2];
          if (userElement && userElement.props) {
            const user = userStore.getUser(userId);
            const member = memberStore.getMember(guildId, userId) || {};
            const displayName = usernameUtils.getName(guildId, this.props.channel.id, user);

            /* User Format & Emoji Hider */
            const userFormat = getSetting('userFormat', '**{displayName}**');
            userElement.type = userFormat.length > 0 && !(/^\*\*((?:\\[\s\S]|[^\\])+?)\*\*(?!\*)/).test(userFormat) ? 'span' : 'strong';

            const formattedUser = _this.parseUser(user, displayName);
            const splitUsername = _this.normalizeUsername(formattedUser).split(_this.getEmojiRegex()).filter(Boolean);

            /* Colour Gradient */
            if (this.props.channel.id === '1337') {
              member.colorString = '#' + Number(userId).toString(16).slice(0, 6);
            }

            userElement.props.children = (splitUsername.length > 0 ? splitUsername : [ _this.normalizeUsername(user.username, true) ]).map(substring => {
              const parseFormat = _this.parser.reactParserFor(_this.getCustomRules());
              if (!_this.getEmojiRegex(true).test(substring) && getSetting('colorGradient', false) && member.colorString) {
                return React.createElement('span', {
                  className: 'gradient',
                  style: {
                    '--smartTypers-primary': member.colorString,
                    '--smartTypers-secondary': _this.shadeColor(member.colorString, 75)
                  }
                }, substring);
              }

              return parseFormat(substring);
            });

            /* User Popout and Context Menu */
            userElement.props = Object.assign({}, userElement.props, {
              className: [ 'typing-user', getSetting('userPopout', true) && 'clickable' ].filter(Boolean).join(' '),
              onClick: (e) => _this.handleUserClick(userId, this.props.channel, e),
              onContextMenu: (e) => _this.openUserContextMenu(userId, guildId, this.props.channel, e)
            });
          }
        }

        /* Disable Typing Indicator */
        if (getSetting('disableIndicator', false)) {
          delete res.props.children[0];
        }
      }

      return res;
    });
  }

  pluginWillUnload () {
    powercord.api.settings.unregisterSettings(this.entityID);

    uninject('smartTypers-popouts');
  }

  handleUserClick (userId, channel, event) {
    if (channel.id !== '1337' && this.settings.get('userShiftClick', true) && event.shiftKey) {
      const { ComponentDispatch } = getModule([ 'ComponentDispatch' ], false);
      return ComponentDispatch.dispatchToLastSubscribed(constants.ComponentActions.INSERT_TEXT, {
        content: `<@${userId}>`
      });
    }

    const UserPopout = getModuleByDisplayName('UserPopout', false);
    const PopoutDispatcher = getModule([ 'openPopout' ], false);
    const guildId = channel.guild_id;

    if (this.settings.get('userPopout', true) && event.target) {
      PopoutDispatcher.openPopout(event.target, {
        closeOnScroll: false,
        containerClass: 'smartTypers-popout',
        render: (props) => React.createElement(UserPopout, {
          ...props,
          userId,
          guildId
        }),
        shadow: false,
        position: 'bottom'
      }, 'typing-user-popout');

      setTimeout(() => document.querySelector('.smartTypers-popout').style.filter = 'blur(0)', 100);
    }
  }

  openUserContextMenu (userId, guildId, channel, event) {
    const GroupDMUserContextMenu = getModuleByDisplayName('GroupDMUserContextMenu', false);
    const GuildChannelUserContextMenu = getModuleByDisplayName('GuildChannelUserContextMenu', false);
    const userStore = getModule([ 'getCurrentUser' ], false);

    if (this.settings.get('userContextMenu', true)) {
      if (!guildId) {
        return contextMenu.openContextMenu(event, (props) => React.createElement(GroupDMUserContextMenu, {
          ...props,
          user: userStore.getUser(userId),
          channel
        }));
      }

      contextMenu.openContextMenu(event, (props) => React.createElement(GuildChannelUserContextMenu, {
        ...props,
        user: userStore.getUser(userId),
        guildId,
        channelId: channel.id,
        showMediaItems: false,
        popoutPosition: 'top'
      }));
    }
  }

  getEmojiRegex (global) {
    return new RegExp(/(\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|[\u2702-\u27b0])/, global ? 'g' : '');
  }

  getInvisibleRegex (global) {
    // eslint-disable-next-line no-control-regex
    return new RegExp(/([\0-\x1f\x7f-\x9f\xad\u02de\u0378\u0379\u037f-\u0383\u038b\u038d\u03a2\u0528-\u0530\u0557\u0558\u0560\u0588\u058b-\u058e\u0590\u05c8-\u05cf\u05eb-\u05ef\u05f5-\u0605\u061c\u061d\u06dd\u070e\u070f\u074b\u074c\u07b2-\u07bf\u07fb-\u07ff\u082e\u082f\u083f\u085c\u085d\u085f-\u089f\u08a1\u08ad-\u08e3\u08ff\u0978\u0980\u0984\u098d\u098e\u0991\u0992\u09a9\u09b1\u09b3-\u09b5\u09ba\u09bb\u09c5\u09c6\u09c9\u09ca\u09cf-\u09d6\u09d8-\u09db\u09de\u09e4\u09e5\u09fc-\u0a00\u0a04\u0a0b-\u0a0e\u0a11\u0a12\u0a29\u0a31\u0a34\u0a37\u0a3a\u0a3b\u0a3d\u0a43-\u0a46\u0a49\u0a4a\u0a4e-\u0a50\u0a52-\u0a58\u0a5d\u0a5f-\u0a65\u0a76-\u0a80\u0a84\u0a8e\u0a92\u0aa9\u0ab1\u0ab4\u0aba\u0abb\u0ac6\u0aca\u0ace\u0acf\u0ad1-\u0adf\u0ae4\u0ae5\u0af2-\u0b00\u0b04\u0b0d\u0b0e\u0b11\u0b12\u0b29\u0b31\u0b34\u0b3a\u0b3b\u0b45\u0b46\u0b49\u0b4a\u0b4e-\u0b55\u0b58-\u0b5b\u0b5e\u0b64\u0b65\u0b78-\u0b81\u0b84\u0b8b-\u0b8d\u0b91\u0b96-\u0b98\u0b9b\u0b9d\u0ba0-\u0ba2\u0ba5-\u0ba7\u0bab-\u0bad\u0bba-\u0bbd\u0bc3-\u0bc5\u0bc9\u0bce\u0bcf\u0bd1-\u0bd6\u0bd8-\u0be5\u0bfb-\u0c00\u0c04\u0c0d\u0c11\u0c29\u0c34\u0c3a-\u0c3c\u0c45\u0c49\u0c4e-\u0c54\u0c57\u0c5a-\u0c5f\u0c64\u0c65\u0c70-\u0c77\u0c80\u0c81\u0c84\u0c8d\u0c91\u0ca9\u0cb4\u0cba\u0cbb\u0cc5\u0cc9\u0cce-\u0cd4\u0cd7-\u0cdd\u0cdf\u0ce4\u0ce5\u0cf0\u0cf3-\u0d01\u0d04\u0d0d\u0d11\u0d3b\u0d3c\u0d45\u0d49\u0d4f-\u0d56\u0d58-\u0d5f\u0d64\u0d65\u0d76-\u0d78\u0d80\u0d81\u0d84\u0d97-\u0d99\u0db2\u0dbc\u0dbe\u0dbf\u0dc7-\u0dc9\u0dcb-\u0dce\u0dd5\u0dd7\u0de0-\u0df1\u0df5-\u0e00\u0e3b-\u0e3e\u0e5c-\u0e80\u0e83\u0e85\u0e86\u0e89\u0e8b\u0e8c\u0e8e-\u0e93\u0e98\u0ea0\u0ea4\u0ea6\u0ea8\u0ea9\u0eac\u0eba\u0ebe\u0ebf\u0ec5\u0ec7\u0ece\u0ecf\u0eda\u0edb\u0ee0-\u0eff\u0f48\u0f6d-\u0f70\u0f98\u0fbd\u0fcd\u0fdb-\u0fff\u10c6\u10c8-\u10cc\u10ce\u10cf\u1249\u124e\u124f\u1257\u1259\u125e\u125f\u1289\u128e\u128f\u12b1\u12b6\u12b7\u12bf\u12c1\u12c6\u12c7\u12d7\u1311\u1316\u1317\u135b\u135c\u137d-\u137f\u139a-\u139f\u13f5-\u13ff\u169d-\u169f\u16f1-\u16ff\u170d\u1715-\u171f\u1737-\u173f\u1754-\u175f\u176d\u1771\u1774-\u177f\u17de\u17df\u17ea-\u17ef\u17fa-\u17ff\u180f\u181a-\u181f\u1878-\u187f\u18ab-\u18af\u18f6-\u18ff\u191d-\u191f\u192c-\u192f\u193c-\u193f\u1941-\u1943\u196e\u196f\u1975-\u197f\u19ac-\u19af\u19ca-\u19cf\u19db-\u19dd\u1a1c\u1a1d\u1a5f\u1a7d\u1a7e\u1a8a-\u1a8f\u1a9a-\u1a9f\u1aae-\u1aff\u1b4c-\u1b4f\u1b7d-\u1b7f\u1bf4-\u1bfb\u1c38-\u1c3a\u1c4a-\u1c4c\u1c80-\u1cbf\u1cc8-\u1ccf\u1cf7-\u1cff\u1de7-\u1dfb\u1f16\u1f17\u1f1e\u1f1f\u1f46\u1f47\u1f4e\u1f4f\u1f58\u1f5a\u1f5c\u1f5e\u1f7e\u1f7f\u1fb5\u1fc5\u1fd4\u1fd5\u1fdc\u1ff0\u1ff1\u1ff5\u1fff\u200b-\u200f\u202a-\u202e\u2060-\u206f\u2072\u2073\u208f\u209d-\u209f\u20bb-\u20cf\u20f1-\u20ff\u218a-\u218f\u23f4-\u23ff\u2427-\u243f\u244b-\u245f\u2700\u2b4d-\u2b4f\u2b5a-\u2bff\u2c2f\u2c5f\u2cf4-\u2cf8\u2d26\u2d28-\u2d2c\u2d2e\u2d2f\u2d68-\u2d6e\u2d71-\u2d7e\u2d97-\u2d9f\u2da7\u2daf\u2db7\u2dbf\u2dc7\u2dcf\u2dd7\u2ddf\u2e3c-\u2e7f\u2e9a\u2ef4-\u2eff\u2fd6-\u2fef\u2ffc-\u2fff\u3040\u3097\u3098\u3100-\u3104\u312e-\u3130\u318f\u31bb-\u31bf\u31e4-\u31ef\u321f\u32ff\u4db6-\u4dbf\u9fcd-\u9fff\ua48d-\ua48f\ua4c7-\ua4cf\ua62c-\ua63f\ua698-\ua69e\ua6f8-\ua6ff\ua78f\ua794-\ua79f\ua7ab-\ua7f7\ua82c-\ua82f\ua83a-\ua83f\ua878-\ua87f\ua8c5-\ua8cd\ua8da-\ua8df\ua8fc-\ua8ff\ua954-\ua95e\ua97d-\ua97f\ua9ce\ua9da-\ua9dd\ua9e0-\ua9ff\uaa37-\uaa3f\uaa4e\uaa4f\uaa5a\uaa5b\uaa7c-\uaa7f\uaac3-\uaada\uaaf7-\uab00\uab07\uab08\uab0f\uab10\uab17-\uab1f\uab27\uab2f-\uabbf\uabee\uabef\uabfa-\uabff\ud7a4-\ud7af\ud7c7-\ud7ca\ud7fc-\uf8ff\ufa6e\ufa6f\ufada-\ufaff\ufb07-\ufb12\ufb18-\ufb1c\ufb37\ufb3d\ufb3f\ufb42\ufb45\ufbc2-\ufbd2\ufd40-\ufd4f\ufd90\ufd91\ufdc8-\ufdef\ufdfe\ufdff\ufe1a-\ufe1f\ufe27-\ufe2f\ufe53\ufe67\ufe6c-\ufe6f\ufe75\ufefd-\uff00\uffbf-\uffc1\uffc8\uffc9\uffd0\uffd1\uffd8\uffd9\uffdd-\uffdf\uffe7\uffef-\ufffb\ufffe\uffff])/, global ? 'g' : '');
  }

  normalizeUsername (username, fallback) {
    const emojiRegex = (global) => this.getEmojiRegex(global);
    const cleanUsername = this.settings.get('hideEmojis', false) ? username.replace(emojiRegex(true), '') : username;

    if (fallback && cleanUsername.replace(this.getInvisibleRegex(true), '').length === 0) {
      return '[Unnamed User]';
    }

    return cleanUsername;
  }

  getCustomRules () {
    return global._.omit(this.parser.defaultRules, [ 'autolink', 'blockQuote', 'br', 'channel', 'codeBlock', 'roleMention', 'spoiler', 'url' ]);
  }

  parseUser (user, displayName) {
    const userFormat = this.settings.get('userFormat', '**{displayName}**') || '**{displayName}**';
    const variables = {
      ...(({ username, tag, id }) => ({ username, tag, id }))(user),
      discriminator: `#${user.discriminator}`,
      displayName
    };

    return userFormat.replace(/^\*\*(.*)\*\*$/, '$1').replace(/{([\s\S]+?)}/g, (_, key) => variables[key]);
  }

  shadeColor (color, percent) {
    return `#${[ 1, 3, 5 ].map(s => parseInt(color.substr(s, 2), 16))
      .map(c => parseInt((c * (100 + percent)) / 100))
      .map(c => (c < 255 ? c : 255))
      .map(c => c.toString(16).padStart(2, '0')).join('')}`;
  }
};
