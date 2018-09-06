import React, { Component } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Label, Input, Form, FormGroup } from 'reactstrap';
import FontAwesome from 'react-fontawesome';

import './AdminPanel.css';

class AdminPanel extends Component {
  constructor() {
    super();

    this.state = {
      name: '',
      email: '',
      validEmail: true,
      error: false,
      maxInvitations: 0,
      rows: [],
      maxInviteeCount: 0,
      selectedInviteeCount: 0,
      invitationSentCount: 0,
      specificInviteeRows: [],
      recipients: [],
      finalRecipients: [],
      emailModal: false,
      recipientsModal: false,
      isInvitationEmail: false,
      newAdminRoleID: 1,
      newAdminEmail: '',
      allAdmins: [],
      allUnregisteredAdmins: [],
      deleteAdminModal: false,
      deleteAdminEmail: '',
      editEmailModal: false,
      editAdminEmail: '',
      editAdminRoleID: 1,
      roleID: !localStorage.getItem('roleID') ? 1 : parseInt(localStorage.getItem('roleID'), 10)
    };

    setInterval(this.getAllHeadInvitees, 5000);

    if (this.state.roleID === 4) {
      setInterval(this.getAllAdmins, 5000);
    }
  }

  fetchInternal = (url, requestMethod = 'GET', body = {}) => {
    return fetch(url, {
      method: requestMethod,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: Object.keys(body).length !== 0 ? JSON.stringify(body) : null
    }).then(res => {
      if (res.status === 401) {
        localStorage.removeItem('token');

        window.location.reload();
      }

      const contentType = res.headers.get('Content-Type');
      if (contentType && contentType.indexOf('application/json') !== -1) {
        return Promise.resolve(res.json());
      }
      
      this.setState({ roleID: !localStorage.getItem('roleID') ? 1 : parseInt(localStorage.getItem('roleID'), 10) });
    });
  }

  componentDidMount = () => {
    this.getAllHeadInvitees();

    if (this.state.roleID === 4) {
      this.getAllAdmins();
    }
  }

  verifyEmail = (email) => {
    const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!regex.test(email.toLowerCase())) {
      this.setState({ validEmail: false });

      return false;
    }

    return true;
  }

  getAllHeadInvitees = () => {
    this.fetchInternal('/api/getAllHeadInvitees')
      .then(res => {
        if (!res) {
          return;
        }

        const rows = [];
        const recipients = [];

        let maxInviteeCount = 0;
        let selectedInviteeCount = 0;
        let invitationSentCount = 0;

        res.forEach((row, i) => {
          rows.push(
            <tr key={'row' + i}>
              <td key={'uniqueID' + i}><a href='' onClick={event => this.handleUniqueIDClick(event, row.UniqueID)}>{row.UniqueID}</a></td>
              <td key={'name' + i}>{row.Name}</td>
              <td key={'email' + i}>{row.Email}</td>
              <td key={'maxInvitations' + i}>{row.MaxInvitations}</td>
              <td key={'selectedInvitations' + i}>{row.SelectedInvitations}</td>
              <td key={'invitationSent' + i}>{row.InvitationSent}</td>
              <td key={'edit' + i}><FontAwesome name='edit' style={{ display: this.state.roleID >= 2 ? 'block' : 'none', cursor: 'pointer', padding: '0 20px' }} onClick={() => this.handleEditClick(row)} /></td>
              <td key={'delete' + i}><FontAwesome name='remove' style={{ display: this.state.roleID >= 2 ? 'block' : 'none', cursor: 'pointer', padding: '0 20px' }} onClick={() => this.handleDeleteClick(row.UniqueID)} /></td>
            </tr>
          );

          recipients.push({
            id: row.UniqueID,
            name: row.Name,
            email: row.Email
          });

          maxInviteeCount += row.MaxInvitations;
          selectedInviteeCount += row.SelectedInvitations;
          invitationSentCount += row.InvitationSent === 'Yes' ? 1 : 0;
        });

        this.setState({ 
          rows: rows,
          recipients: recipients,
          maxInviteeCount: maxInviteeCount,
          selectedInviteeCount: selectedInviteeCount,
          invitationSentCount: invitationSentCount
        });
      })
      .catch(err => console.error(err));
  }

  handleDeleteConfirm = (event) => {
    this.setState({ inviteeModal: false });

    const url = '/api/deleteHeadInvitee';

    this.fetchInternal(url, 'DELETE', {
      id: this.state.deleteID
    }).then(res => this.getAllHeadInvitees())
      .catch(err => console.error(err));
  }

  handleDeleteClick = (id) => {
    this.setState({ inviteeModal: true });

    this.setState({ deleteID: id });
  }

  handleEditNameChange = (event) => {
    this.setState({ editName: event.target.value });
  }

  handleEditEmailChange = (event) => {
    this.setState({ editEmail: event.target.value });
  }

  handleEditMaxInvitationsChange = (event) => {
    const invitations = event.target.validity.valid ? event.target.value : this.state.editMaxInvitations;

    this.setState({ editMaxInvitations: invitations });
  }

  handleEditConfirm = (event) => {
    this.setState({ inviteeEditModal: false });

    const url = '/api/editSpecificHeadInvitee';

    this.fetchInternal(url, 'POST', {
      id: this.state.editID,
      name: this.state.editName,
      email: this.state.editEmail,
      maxInvitations: this.state.editMaxInvitations
    }).then(res => {
      if (res) {
        this.setState({ error: true, errorMessage: res.error });
      }
      
      this.getAllHeadInvitees();
    }).catch(err => console.error(err));
  }

  handleEditClick = (data) => {
    this.setState({ 
      inviteeEditModal: true,
      editID: data.UniqueID,
      editName: data.Name,
      editEmail: data.Email,
      editMaxInvitations: data.MaxInvitations
    });
  }

  handleNameChange = (event) => {
    this.setState({ name: event.target.value });
  }

  handleEmailChange = (event) => {
    this.setState({ email: event.target.value });
  }

  handleMaxInvitationsChange = (event) => {
    const invitations = event.target.validity.valid ? event.target.value : this.state.maxInvitations;

    this.setState({ maxInvitations: invitations });
  }

  handleSubmit = (event) => {
    event.preventDefault();

    this.setState({ 
      error: false,
      validEmail: true
    });

    if (!this.verifyEmail(this.state.email)) {
      return;
    }

    if (this.state.name === '' || this.state.email === '' || this.state.maxInvitations === 0) {
      return;
    }

    const url = '/api/addHeadInvitee';

    this.fetchInternal(url, 'POST', {
      name: this.state.name,
      email: this.state.email,
      maxInvitations: this.state.maxInvitations
    }).then(res => {
      if (res) {
        this.setState({ 
          error: true, 
          errorMessage: res.error
        });
      }
      
      this.getAllHeadInvitees();
    }).catch(err => console.error(err));
  }

  handleHTMLEditorChange = (event) => {
    this.setState({ emailHTML: event.target.value });
  }

  handleEmailConfirm = () => {
    this.setState({ 
      emailModal: false,
      recipientsModal: true
    });
  }

  handleEmailClick = () => {
    this.setState({ emailModal: true });
  }

  handleRecipientCheckboxChange = (e, text) => {
    let emails = this.state.finalRecipients.map(recipient => recipient.email);

    if (e.target.checked && !emails.includes(text)) {
      emails.push(text);
    } else if (!e.target.checked && emails.includes(text)) {
      emails = emails.filter(item => item !== text);
    }

    this.setState({ finalRecipients: this.state.finalRecipients.filter(recipient => emails.includes(recipient.email)) });
  }

  handleRecipientConfirm = () => {
    this.setState({ recipientsModal: false });

    this.fetchInternal('/api/executeEmailToHeadInvitees', 'POST', {
      html: this.state.emailHTML,
      recipients: this.state.finalRecipients,
      isInvitationEmail: this.state.isInvitationEmail
    }).catch(err => console.error(err));
  }

  handleUniqueIDClick = (event, id) => {
    event.preventDefault();

    this.fetchInternal('/api/getSpecificSubInvitees?id=' + id)
      .then(res => {
        if (!res) {
          return;
        }

        const specificInviteeRows = [];
        res.forEach((row, i) => {
          specificInviteeRows.push(
            <tr key={'specificInviteeRow' + i}>
              <td key={'name' + i}>{row.Name}</td>
            </tr>
          );
        });

        this.setState({ specificInviteeRows: specificInviteeRows });

        this.getAllHeadInvitees();
      })
      .catch(err => console.error(err));
  }

  handleFileUpload = (event) => {
    event.preventDefault();
    
    this.setState({ 
      error: false,
      validEmail: true
    });

    if (!event.target.files || !event.target.files[0]) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const data = reader.result;

      const split = data.split('\n');

      if (split.length <= 0) {
        return;
      }

      const callback = (line) => {
        const commaSplit = line.split(',');

        if (commaSplit.length !== 3) {
          return;
        }

        const name = commaSplit[0];
        const email = commaSplit[1];
        const maxInvitations = commaSplit[2];

        if (name === '' || email === '' || maxInvitations === 0) {
          return;
        }

        if (!this.verifyEmail(email)) {
          return;
        }
    
        this.fetchInternal('/api/addHeadInvitee', 'POST', {
          name: name,
          email: email,
          maxInvitations: maxInvitations
        }).then(res => {
          if (res) {
            this.setState({ error: true, errorMessage: res.error });
          }
          
          this.getAllHeadInvitees();
        }).catch(err => console.error(err));
      };

      for (let i = 0; i < split.length; i++) {
        setTimeout(() => callback(split[i]), i * 3000);
      }
    }

    reader.readAsText(event.target.files[0]);
  }

  handleSelectAll = () => {
    this.setState({ finalRecipients: this.state.recipients });
  }

  handleSelectNone = () => {
    this.setState({ finalRecipients: [] });
  }

  handleSelectUsersNotYetInvited = () => {
    this.fetchInternal('/api/getAllHeadInviteesNotYetInvited')
      .then(res => {
        if (!res) {
          return;
        }

        this.setState({ finalRecipients: res });
      })
      .catch(err => console.error(err));
  }

  handleSelectUsersNotYetInputted = () => {
    this.fetchInternal('/api/getAllHeadInviteesNotYetInputted')
      .then(res => {
        if (!res) {
          return;
        }

        this.setState({ finalRecipients: res });
      })
      .catch(err => console.error(err));
  }

  handleRegisterNewAdmin = () => {
    this.fetchInternal('/api/addNewAdmin', 'POST', {
      email: this.state.newAdminEmail,
      roleID: this.state.newAdminRoleID
    }).then(_ => {
      this.getAllAdmins();
    });
  }

  handleAdminDeleteClick = (email) => {
    this.setState({
      deleteAdminModal: true,
      deleteAdminEmail: email 
    });
  }

  handleAdminDeleteConfirm = () => {
    this.setState({ deleteAdminModal: false });

    this.fetchInternal('/api/deleteAdmin', 'DELETE', {
      email: this.state.deleteAdminEmail
    }).then(_ => {
      this.getAllAdmins();
    });
  }

  handleAdminEditClick = (row) => {
    this.setState({ 
      editAdminEmail: row.Email, 
      editAdminRoleID: row.RoleID,
      editEmailModal: true
    });
  }

  handleAdminEditConfirm = () => {
    this.setState({ editEmailModal: false });

    this.fetchInternal('/api/editAdminEmail', 'POST', {
      email: this.state.editAdminEmail,
      roleID: this.state.editAdminRoleID
    }).then(_ => {
      this.getAllAdmins();
    });
  }

  handleAdminEditEmailChange = (event) => {
    this.setState({ editAdminEmail: event.target.value });
  }

  handleAdminEditRoleIDChange = (event) => {
    const roleID = event.target.validity.valid ? event.target.value : this.state.editMaxInvitations;

    this.setState({ editAdminRoleID: roleID });
  }

  handleUnregisteredAdminResendClick = (email) => {
    this.fetchInternal('/api/resendAdminEmail', 'POST', {
      email: email
    }).then(_ => {
      this.getAllAdmins();
    });
  }

  handleUnregisteredAdminDeleteClick = (email) => {
    this.setState({
      deleteUnregisteredAdminModal: true,
      deleteUnregisteredAdminEmail: email 
    });
  }

  handleUnregisteredAdminDeleteConfirm = () => {
    this.setState({ deleteUnregisteredAdminModal: false });

    this.fetchInternal('/api/deleteUnregisteredAdmin', 'DELETE', {
      email: this.state.deleteUnregisteredAdminEmail
    }).then(_ => {
      this.getAllAdmins();
    });
  }

  getAllAdmins = () => {
    this.fetchInternal('/api/getAllAdmins')
      .then(res => {
        if (!res) {
          return;
        }

        const allAdmins = [];
        res.forEach((row, i) => {
          allAdmins.push(
            <tr key={'allAdmins' + i}>
              <td key={'adminUsername' + i}>{row.Username}</td>
              <td key={'adminEmail' + i}>{row.Email}</td>
              <td key={'adminRoleID' + i}>{row.RoleID}</td>
              <td key={'adminRoleIDEdit' + i}><FontAwesome name='edit' style={{ display: parseInt(row.RoleID, 10) === 4 ? 'none' : 'block', cursor: 'pointer', padding: '0 20px' }} onClick={() => this.handleAdminEditClick(row)} /></td>
              <td key={'adminRoleIDDelete' + i}><FontAwesome name='remove' style={{ display: parseInt(row.RoleID, 10) === 4 ? 'none' : 'block', cursor: 'pointer', padding: '0 20px' }} onClick={() => this.handleAdminDeleteClick(row.Email)} /></td>
            </tr>
          );
        });

        this.setState({ allAdmins: allAdmins });
      });

    this.fetchInternal('/api/getAllUnregisteredAdmins')
      .then(res => {
        if (!res) {
          return;
        }

        const allUnregisteredAdmins = [];
        res.forEach((row, i) => {
          allUnregisteredAdmins.push(
            <tr key={'allUnregisteredAdmins' + i}>
              <td key={'unregisteredAdminEmail' + i}>{row.Email}</td>
              <td key={'unregisteredAdminRoleID' + i}>{row.RoleID}</td>
              <td key={'unregisteredAdminRoleIDResend' + i}><FontAwesome name='repeat' style={{ cursor: 'pointer', padding: '0 20px' }} onClick={() => this.handleUnregisteredAdminResendClick(row.Email)} /></td>
              <td key={'unregisteredAdminRoleIDDelete' + i}><FontAwesome name='remove' style={{ cursor: 'pointer', padding: '0 20px' }} onClick={() => this.handleUnregisteredAdminDeleteClick(row.Email)} /></td>
            </tr>
          );
        });

        this.setState({ allUnregisteredAdmins: allUnregisteredAdmins });
      });
  }

  handleLogout = () => {
    localStorage.clear();

    window.location.reload();
  }

  render() {
    const recipients = [];

    this.state.recipients.forEach((recipient, i) => {
      const isChecked = this.state.finalRecipients.map(recipient => recipient.email).includes(recipient.email);

      recipients.push(
        <Label key={'recipientLabel' + i} style={{ display: 'block', marginLeft: '20px' }}>
          <Input key={'recipientCheck' + i} type='checkbox' onChange={(e) => this.handleRecipientCheckboxChange(e, recipient.email)} checked={isChecked} />
          {recipient.email}
        </Label>
      );
    });

    return (
      <div>
        <div>
          <Button color='primary' onClick={this.handleLogout} style={{ position: 'absolute', right: '0' }}>Logout</Button>
          <div style={{ display: this.state.error ? 'block' : 'none', color: 'red' }}>{this.state.errorMessage}</div>
          <div style={{ display: !this.state.validEmail ? 'block' : 'none', color: 'red' }}>Invalid email address!</div>
          <table>
            <thead>
              <tr>
                <th>Head Invitees</th>
              </tr>
              <tr>
                <th>UniqueID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Max Invitations ({this.state.maxInviteeCount})</th>
                <th>Selected Invitations ({this.state.selectedInviteeCount})</th>
                <th>Invitation Sent ({this.state.invitationSentCount}/{this.state.recipients.length})</th>
              </tr>
            </thead>
            <tbody>
              {this.state.rows}
            </tbody>
          </table>
          <table>
            <thead>
              <tr>
                <th>All Invitees</th>
              </tr>
              <tr>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {this.state.specificInviteeRows}
            </tbody>
          </table>
          
          <div>
            <form onSubmit={this.handleSubmit} style={{ display: this.state.roleID >= 2 ? (this.state.roleID === 4 ? 'inline-block' : 'block') : 'none', width: this.state.roleID === 4 ? '50%' : '100%' }}>
              <label>
                Name:
              <input type='text' value={this.state.name} onChange={this.handleNameChange} name='name' autoComplete='foo' />
              </label><br />
              <label>
                Email:
              <input type='text' value={this.state.email} onChange={this.handleEmailChange} name='email' autoComplete='foo' />
              </label><br />
              <label>
                Max Invitations:
              <input type='text' pattern='[0-9]*' value={this.state.maxInvitations} onChange={this.handleMaxInvitationsChange} name='max-invitations' autoComplete='foo' />
              </label><br />
              <input type='file' onChange={(e) => this.handleFileUpload(e)} style={{ display: 'block', marginBottom: '20px' }} />
              <input type='submit' value='Submit' />
            </form>

            <div style={{ width: '50%', display: this.state.roleID === 4 ? 'inline-block' : 'none' }}>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Administrators</th>
                  </tr>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>RoleID</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.allAdmins}
                </tbody>
              </table>
              
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Unregistered Administrators</th>
                  </tr>
                  <tr>
                    <th>Email</th>
                    <th>RoleID</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.allUnregisteredAdmins}
                </tbody>
              </table>

              <Form>
                <FormGroup>
                  <Label for='adminEmail'>Admin Email</Label>
                  <Input id='adminEmail' value={this.state.newAdminEmail} onChange={e => this.setState({ newAdminEmail: e.target.value })} autoComplete='off' />

                  <br />
                  <Label for='adminRoleID'>Admin RoleID</Label>
                  <Input id='adminRoleID' value={this.state.newAdminRoleID} onChange={e => this.setState({ newAdminRoleID: e.target.value })} autoComplete='off' />

                  <br />
                  <Button color='primary' onClick={this.handleRegisterNewAdmin}>Register New Admin</Button>
                </FormGroup>
              </Form>
            </div>
          </div>

          <Modal isOpen={this.state.inviteeModal} centered={true}>
            <ModalHeader>Delete Entry?</ModalHeader>
            <ModalBody>Are you sure you want to delete ID: '{this.state.deleteID}'</ModalBody>
            <ModalFooter>
              <Button color='primary' onClick={this.handleDeleteConfirm}>Yes</Button>
              <Button color='secondary' onClick={() => this.setState({ inviteeModal: false })}>Cancel</Button>
            </ModalFooter>
          </Modal>

          <Modal isOpen={this.state.inviteeEditModal} centered={true}>
            <ModalHeader>Edit Entry</ModalHeader>
            <ModalBody>
              <form style={{ width: '100%' }}>
                <label>
                  Name:
                <input type='text' value={this.state.editName} onChange={this.handleEditNameChange} name='edit-name' autoComplete='foo' />
                </label><br />
                <label>
                  Email:
                <input type='text' value={this.state.editEmail} onChange={this.handleEditEmailChange} name='edit-email' autoComplete='foo' />
                </label><br />
                <label>
                  Max Invitations:
                <input type='text' pattern='[0-9]*' value={this.state.editMaxInvitations} onChange={this.handleEditMaxInvitationsChange} name='edit-max-invitations' autoComplete='foo' />
                </label><br />
              </form>
            </ModalBody>
            <ModalFooter>
              <Button color='primary' onClick={this.handleEditConfirm}>Yes</Button>
              <Button color='secondary' onClick={() => this.setState({ inviteeEditModal: false })}>Cancel</Button>
            </ModalFooter>
          </Modal>
        </div>

        <div style={{ display: this.state.roleID >= 3 ? 'block' : 'none', margin: '50px 0 30px 0' }}>
          <textarea style={{ display: 'block', width: '100%', margin: '20px 0 20px 0' }} onChange={this.handleHTMLEditorChange} />
          <input type='submit' value='Send Email' onClick={this.handleEmailClick} />
        </div>

        <div dangerouslySetInnerHTML={{ __html: this.state.emailHTML}}></div>

        <Modal size='lg' isOpen={this.state.emailModal} centered={true}>
          <ModalBody dangerouslySetInnerHTML={{ __html: this.state.emailHTML }} />
          <ModalFooter>
            <Button color='primary' onClick={this.handleEmailConfirm}>Yes</Button>
            <Button color='secondary' onClick={() => this.setState({ emailModal: false })}>Cancel</Button>
          </ModalFooter>
        </Modal>

        <Modal size='lg' isOpen={this.state.recipientsModal} centered={true}>
          <ModalBody>
            <div>
              <div>{recipients}</div>
              <Button color='primary' onClick={this.handleSelectAll}>Select All</Button>
              <Button color='primary' onClick={this.handleSelectNone} style={{ marginLeft: '20px' }}>Select None</Button>
              <Button color='primary' onClick={this.handleSelectUsersNotYetInvited} style={{ marginLeft: '20px' }}>Select Not Yet Invited</Button>
              <Button color='primary' onClick={this.handleSelectUsersNotYetInputted} style={{ marginLeft: '20px' }}>Select Not Yet Inputted</Button>
              <Label style={{ marginLeft: '20px' }}>
                <Input type='checkbox' onChange={() => this.setState({ isInvitationEmail: !this.state.isInvitationEmail })} checked={this.state.isInvitationEmail} />
                Is Invitation Email
              </Label>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color='primary' onClick={this.handleRecipientConfirm}>Yes</Button>
            <Button color='secondary' onClick={() => this.setState({ recipientsModal: false })}>Cancel</Button>
          </ModalFooter>
        </Modal>

        <Modal isOpen={this.state.deleteAdminModal} centered={true}>
          <ModalHeader>Delete Entry?</ModalHeader>
          <ModalBody>Are you sure you want to delete the admin with email: '{this.state.deleteAdminEmail}'</ModalBody>
          <ModalFooter>
            <Button color='primary' onClick={this.handleAdminDeleteConfirm}>Yes</Button>
            <Button color='secondary' onClick={() => this.setState({ deleteAdminModal: false })}>Cancel</Button>
          </ModalFooter>
        </Modal>

        <Modal isOpen={this.state.editEmailModal} centered={true}>
          <ModalHeader>Edit Entry</ModalHeader>
          <ModalBody>
            <form style={{ width: '100%' }}>
              <label>
                Email:
              <input type='text' value={this.state.editAdminEmail} onChange={this.handleAdminEditEmailChange} name='edit-admin-email' autoComplete='foo' />
              </label><br />
              <label>
                RoleID:
              <input type='text' pattern='[0-9]*' value={this.state.editAdminRoleID} onChange={this.handleAdminEditRoleIDChange} name='edit-admin-roleID' autoComplete='foo' />
              </label><br />
            </form>
          </ModalBody>
          <ModalFooter>
            <Button color='primary' onClick={this.handleAdminEditConfirm}>Yes</Button>
            <Button color='secondary' onClick={() => this.setState({ editEmailModal: false })}>Cancel</Button>
          </ModalFooter>
        </Modal>

        <Modal isOpen={this.state.deleteUnregisteredAdminModal} centered={true}>
          <ModalHeader>Delete Entry?</ModalHeader>
          <ModalBody>Are you sure you want to delete the unregistered admin with email: '{this.state.deleteUnregisteredAdminEmail}'</ModalBody>
          <ModalFooter>
            <Button color='primary' onClick={this.handleUnregisteredAdminDeleteConfirm}>Yes</Button>
            <Button color='secondary' onClick={() => this.setState({ deleteUnregisteredAdminModal: false })}>Cancel</Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

export default AdminPanel;
