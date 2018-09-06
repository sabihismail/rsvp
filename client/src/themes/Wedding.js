import React, { Component } from 'react';
import { Input, InputGroup, Button, Tooltip, InputGroupAddon } from 'reactstrap';
import FontAwesome from 'react-fontawesome';
import config from './config';

import './Wedding.css';

class Wedding extends Component {
  constructor(props) {
    super(props);

    this.state = {
      validID: true,
      validName: false,
      submitValue: 'Submit',
      tooltipOpen: false,
      tooltip: 'Input the unique 4 character code that was sent to you (case-sensitive)!'
    }

    if (this.props.id) {
      this.checkIfValidID(this.props.id);
    }

    this.inputButton = React.createRef();
  }

  beforeUnload = (e) => {
    e.returnValue = 'Are you sure you want to leave? Your changes were not saved!';
  }

  getExistingSubInviteeData = () => {
    fetch('/api/getSubInvitees?id=' + this.state.id + '&name=' + this.state.name)
      .then(res => res.status === 200 ? Promise.resolve(res.json()) : Promise.resolve(false))
      .then(res => {
        if (res) {
          this.setState({ selectedInvitees: res.length === 0 ? [{ name: this.state.name }] : res });
        }
      });
  }

  checkIfValidName = (name) => {
    this.setState({ tooltipOpen: false });

    fetch('/api/getSpecificHeadInvitee?id=' + this.state.id + '&name=' + name)
      .then(res => res.status === 200 ? Promise.resolve(res.json()) : Promise.resolve(false))
      .then(res => {
        if (res) {
          this.setState({ 
            validName: true,
            name: res.Name,
            maxInvitations: res.MaxInvitations,
            selectedInvitees: [],
            tooltip: 'Please enter the full name of each individual guest (including yourself) on a new line. To add a new guest, click the "Add Invitee" button below. Blank entries are not permitted!'
          });

          window.addEventListener('beforeunload', this.beforeUnload);

          this.getExistingSubInviteeData();
        } else {
          this.setState({ 
            validName: false,
            name: undefined,
            maxInvitations: undefined,
            selectedInvitees: undefined,
            tooltipOpen: true
          });
        }
      });
  }

  checkIfValidID = (id) => {
    this.setState({ tooltipOpen: false });

    return fetch('/api/isValidHeadInvitee?id=' + id)
      .then(res => Promise.resolve(res.status === 200))
      .then(res => {
        if (res) {
          this.setState({ 
            validID: true,
            id: id,
            tooltip: 'Please enter the name that appears in the subject line of the email invitation you were sent.'
          });
        } else {
          this.setState({ 
            validID: false,
            id: undefined,
            tooltipOpen: true
          });
        }
      });
  }

  handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      if (event.persist) {
        event.persist();
      }

      const input = event.target.value;

      if (this.state.id) {
        this.checkIfValidName(input);
      } else {
        this.checkIfValidID(input)
          .then(res => {
            if (this.state.validID) {
              this.setState({ id: input });

              event.target.value = '';
              window.history.replaceState({}, 'foo', '/' + this.state.id);
            }
          });
      }
    }
  }

  nextStep = () => {
    this.handleKeyPress({
      key: 'Enter',
      target: this.inputButton
    });
  }

  handleAddInvitee = () => {
    this.setState({ tooltipOpen: false });

    const selectedInvitees = this.state.selectedInvitees;

    selectedInvitees.push({
      name: ''
    });

    this.setState({ selectedInvitees: selectedInvitees });
  }

  handleRemoveInvitee = () => {
    this.setState({ tooltipOpen: false });

    const selectedInvitees = this.state.selectedInvitees;

    selectedInvitees.pop();

    this.setState({ selectedInvitees: selectedInvitees });
  }

  handleNameChange = (value, index) => {
    const selectedInvitees = this.state.selectedInvitees;

    selectedInvitees[index].name = value;

    this.setState({ selectedInvitees: selectedInvitees });
  }

  handleSubmitInvitees = () => {
    this.setState({ tooltipOpen: false });

    let validDataInput = true;

    this.state.selectedInvitees.forEach(invitee => {
      if (invitee.name === '') {
        validDataInput = false;
      }
    });

    if (!validDataInput) {
      this.setState({ tooltipOpen: true });
    } else {
      fetch('/api/addSubInvitees', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: this.state.id,
          name: this.state.name,
          inviteeData: this.state.selectedInvitees
        })
      }).then(res => Promise.resolve(res.status === 200))
        .then(res => {
          if (res) {
            this.setState({ submitValue: 'Thank you for your RSVP!' });

            window.removeEventListener('beforeunload', this.beforeUnload);

            setTimeout(() => {
              this.setState({ submitValue: 'Submit' });
            }, 5000);
          }
        });
    }
  }

  render() {
    const invitees = [];
    if (this.state.validName && this.state.selectedInvitees) {
      this.state.selectedInvitees.forEach((invitee, i) => {
        invitees.push(
          <tr key={'row' + i}>
            <td key={'name' + i} style={{ width: '25%' }}>
              <Input
                type='text'
                name='name'
                placeholder='Name'
                defaultValue={invitee.name}
                onChange={(e) => this.handleNameChange(e.target.value, i)}
              />
            </td>
          </tr>
        );
      });
    }

    return (
      <div className='main'>
        <div className='center-div'>
          <div className='question-help'>
            <FontAwesome name='question-circle' id='TooltipHelp' />
            <Tooltip placement='top' isOpen={this.state.tooltipOpen} toggle={() => this.setState({ tooltipOpen: !this.state.tooltipOpen })} target='TooltipHelp'>{this.state.tooltip}</Tooltip>
          </div>

          <h4 className='names-heading move-down'>{config.event}</h4>
          <h2 className='names'>{config.bride} & {config.groom}</h2>

          <div style={{ display: !this.state.validName ? 'block' : 'none' }}>
            <InputGroup>
              <Input
                type='text'
                onKeyPress={this.handleKeyPress}
                placeholder={this.state.id ? 'Please input your full name.' : 'Please input your unique code.'}
                innerRef={x => this.inputButton = x}
              />
              <InputGroupAddon addonType='append'><Button color='danger' onClick={this.nextStep}>Submit</Button></InputGroupAddon>
            </InputGroup>
          </div>
          
          <div style={{ display: this.state.validName ? 'block' : 'none' }}>
            <table className='table-invitees-insert'>
              <tbody>
                {invitees}
              </tbody>
            </table>

            <div className='btns'>
              <div
                className='btn-final-page'
                style={{
                  display: this.state.selectedInvitees && (this.state.selectedInvitees.length !== this.state.maxInvitations) ? 'inline-block' : 'none'
                }}
                onClick={this.handleAddInvitee}
              >
                Add Invitee
              </div>

              <div
                className='btn-final-page'
                style={{
                  display: this.state.selectedInvitees && (this.state.selectedInvitees.length !== 0) ? 'inline-block' : 'none'
                }}
                onClick={this.handleRemoveInvitee}
              >
                Remove Invitee
              </div>

              <div className='btn-final-page' onClick={this.handleSubmitInvitees}>{this.state.submitValue}</div>
            </div>
          </div>
        
          <a className='credits' target='blank' href='https://github.com/sabihismail'>
            Made with <FontAwesome name='heart' className='credits-heart' /> by Sabih
          </a>
        </div>
      </div>
    );
  }
}

export default Wedding;
