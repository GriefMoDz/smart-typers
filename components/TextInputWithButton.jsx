const { React, getModule } = require('powercord/webpack');
const { Flex } = require('powercord/components');
const { FormItem } = require('powercord/components/settings');

const Button = getModule(m => m.ButtonLink, false).default;

module.exports = class TextInputWithButton extends React.PureComponent {
  constructor () {
    super();

    this.classes = getModule([ 'container', 'editIcon' ], false);
  }

  handleChange (e) {
    this.props.onChange(e.currentTarget.value);
  }

  render () {
    const { classes } = this;
    const { title, disabled, placeholder, onClick } = this.props;

    return (
      <FormItem title={title}>
        <div className={[ 'smartTypers-input', classes.container, classes.hasValue, disabled && classes.disabled ].join(' ')}>
          <Flex className={classes.layout}>
            <Flex.Child className={classes.input.split(' ').splice(1).join(' ')}>
              <input type='text' value={this.props.defaultValue} placeholder={placeholder} disabled={disabled} onChange={this.handleChange.bind(this)}></input>
            </Flex.Child>
            <Flex shrink={1} grow={0} style={{ margin: 0 }}>
              <Button className={classes.button} disabled={disabled} size={Button.Sizes.MIN} color={Button.Colors.GREY} look={Button.Looks.GHOST} onClick={onClick}>
                <span className={classes.text}>{this.props.text}</span>
                <span className={[ 'smartTypers-input-icon fal', classes.editIcon ].join(' ')}></span>
              </Button>
            </Flex>
          </Flex>
        </div>
        {this.props.children}
      </FormItem>
    );
  }
};
