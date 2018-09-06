import React, { Component } from 'react';
import { Form, FormGroup, Button, Input, Label } from 'reactstrap';

class AdminRegisterPanel extends Component {
  constructor(props) {
    super(props);

    this.state = {
      username: '',
      password: '',
      token: '',
      email: '',
      error: false,
      errorMessage: '',
      invalidToken: false
    };
  }

  componentDidMount = () => {
    if (this.props.token) {
      this.checkIfValidToken(this.props.token);
    }
  }

  fetchInternal = (url, requestMethod = 'GET', body = {}) => {
    return fetch(url, {
      method: requestMethod,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: Object.keys(body).length !== 0 ? JSON.stringify(body) : null
    }).then(res => {
      if (res.status === 401) {
        this.setState({ errorMessage: res.errorMessage });
      }

      const contentType = res.headers.get('Content-Type');
      if (contentType && contentType.indexOf('application/json') !== -1) {
        return Promise.resolve(res.json());
      }
    });
  }

  checkIfValidToken = (token) => {
    if (token.length !== 40) {
      this.setState({ invalidToken: true });
      return;
    }

    this.fetchInternal('/api/checkIfValidToken?token=' + token)
      .then(res => {
        if (res && res.Email && res.UniqueToken) {
          this.setState({ 
            email: res.Email,
            token: res.UniqueToken
          });
        } else {
          this.setState({ invalidToken: true });
        }
      });
  }

  handleSubmit = (event) => {
    event.preventDefault();

    if (this.state.username === '' || this.state.password === '') {
      return;
    }
    
    this.setState({
      error: false,
      errorMessage: ''
    });

    this.fetchInternal('/api/registerAdmin', 'POST', {
      username: this.state.username,
      password: this.state.password,
      token: this.state.token
    }).then(res => {
      if (res.error) {
        this.setState({ 
          error: true, 
          errorMessage: res.error
        });
      } else if (res.success) {
        window.location.href = '/admin/login';
      }
    }).catch(err => console.error(err));
  }

  render() {
    return (
      <div>
        <div style={{ display: this.state.invalidToken ? 'block' : 'none' }}>
          <h1>This token is invalid!</h1>
        </div>
        <Form style={{ display: !this.state.invalidToken ? 'block' : 'none' }}>
          <FormGroup>
            <Label style={{ display: this.state.error ? 'block' : 'none', color: 'red' }}>Error: {this.state.errorMessage}</Label>

            <Label for='username'>Username</Label>
            <Input type='username' name='username' id='username' value={this.state.username} onChange={e => this.setState({ username: e.target.value })} autoComplete='off' />

            <Label for='password'>Password</Label>
            <Input type='password' name='password' id='password' value={this.state.password} onChange={e => this.setState({ password: e.target.value })} autoComplete='off' />
            
            <Label for='token'>Token</Label>
            <Input type='token' name='token' id='token' value={this.state.token} readOnly />
            
            <Label for='email'>Email</Label>
            <Input type='email' name='email' id='email' value={this.state.email} readOnly />
          </FormGroup>
          <Button onClick={this.handleSubmit}>Submit</Button>
        </Form>
      </div>
    );
  }
}

export default AdminRegisterPanel;
