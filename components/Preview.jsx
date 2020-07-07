const { React, i18n: { Messages }, getModule, getModuleByDisplayName } = require('powercord/webpack');
const { Card } = require('powercord/components');

class ChannelTextArea extends React.PureComponent {
  constructor () {
    super();

    this.filter = (...classes) => classes.filter(Boolean).join(' ');
    this.classes = {
      $channelTextArea: getModule([ 'chatContent', 'form' ], false).channelTextArea,
      ...getModule([ 'slateTextArea', 'placeholder' ], false),
      ...getModule([ 'channelTextArea', 'inner' ], false)
    };
  }

  render () {
    const { classes } = this;

    return <>
      <div className={this.filter(classes.$channelTextArea, classes.channelTextArea, classes.channelTextAreaDisabled, classes.focused)}>
        <div className={this.filter(classes.scrollableContainer, classes.webkit)}>
          <div className={this.filter(classes.inner, classes.innerDisabled, classes.sansAttachButton)}>
            <div className={this.filter(classes.textArea, classes.textAreaSlate, classes.textAreaDisabled, classes.slateContainer)}>
              <div className={this.filter(classes.placeholder, classes.fontSize16Padding)}>{Messages.NO_SEND_MESSAGES_PERMISSION_PLACEHOLDER}</div>
            </div>
          </div>
        </div>
      </div>
    </>;
  }
}

module.exports = class Preview extends React.PureComponent {
  constructor () {
    super();

    this.previewUsers = [];
    this.state = {
      typingRotation: null,
      currentRotation: 0
    };
  }

  componentWillMount () {
    this.startTypingRotation();
  }

  componentWillUnmount () {
    this.stopTypingRotation();
  }

  render () {
    const { default: Channel } = getModule([ 'isPrivate' ], false);

    const fakeChannel = new Channel({ id: '1337' });
    const FluxTypingUsers = getModuleByDisplayName('FluxContainer(TypingUsers)', false);
    const TypingUsers = ((new FluxTypingUsers({ channel: fakeChannel })).render()).type;

    fakeChannel.rateLimitPerUser = null;

    return <Card className='smartTypers-preview'>
      <ChannelTextArea />
      <TypingUsers channel={fakeChannel} typingUsers={this.fetchPreviewUsers()} />
    </Card>;
  }

  fetchPreviewUsers () {
    const cachedUsers = Object.values(getModule([ 'getUsers' ], false).getUsers()).filter(user => user.id !== this.props.main.currentUser.id);
    const getRandomUserId = () => cachedUsers[Math.floor(Math.random() * cachedUsers.length)].id;
    const users = {};

    const { currentRotation } = this.state;

    for (let i = 0; i < currentRotation + 1; i++) {
      const id = this.previewUsers[i] || getRandomUserId();

      if (!this.previewUsers[i]) {
        this.previewUsers[i] = id;
      }

      users[id] = null;
    }

    const maxTypingUsers = this.props.main.settings.get('maxTypingUsers', 3);
    if (currentRotation === 3 && maxTypingUsers > 3) {
      for (let i = currentRotation + 1; i < 10; i++) {
        users[getRandomUserId()] = null;
      }
    }

    return users;
  }

  startTypingRotation () {
    let { typingRotation, currentRotation } = this.state;

    if (!typingRotation) {
      typingRotation = setInterval(() => {
        currentRotation = (currentRotation + 1) % 4;

        if (currentRotation === 3) {
          this.previewUsers = [];
        }

        this.setState({
          typingRotation,
          currentRotation
        });
      }, 10e3);
    }
  }

  stopTypingRotation () {
    clearInterval(this.state.typingRotation);
  }
};
